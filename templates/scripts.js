function initializeVoiceMessaging() {
    class SignalingChannel {
        constructor(senderUsername, recipientUsername) {
            this.senderUsername = senderUsername;
            this.recipientUsername = recipientUsername;
            const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const wsUrl = `${wsScheme}://${window.location.host}/chat/${recipientUsername}/${senderUsername}/`;
            this.socket = new WebSocket(wsUrl);

            this.socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.onMessage(message);
            };

            this.socket.onopen = () => {
                console.log('WebSocket connection opened');
            };

            this.socket.onclose = () => {
                console.log('WebSocket connection closed');
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }

        onMessage(message) {
            const event = new CustomEvent('message', { detail: message });
            document.dispatchEvent(event);
        }

        send(message) {
            this.socket.send(JSON.stringify(message));
        }
    }

    async function handleCall(isInitiator, senderUsername, recipientUsername) {
        const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
        const peerConnection = new RTCPeerConnection(configuration);
        const signalingChannel = new SignalingChannel(senderUsername, recipientUsername);

        signalingChannel.socket.addEventListener('message', async (event) => {
            const message = JSON.parse(event.data);

            if (message.offer) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                signalingChannel.send({ answer: answer });
            } else if (message.answer) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
            } else if (message.iceCandidate) {
                await peerConnection.addIceCandidate(message.iceCandidate);
            }
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                signalingChannel.send({ iceCandidate: event.candidate });
            }
        };

        let localStream;
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        } catch (error) {
            console.error('Error accessing microphone', error);
        }

        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            const audioElement = document.createElement('audio');
            audioElement.srcObject = remoteStream;
            audioElement.controls = true;
            audioElement.autoplay = true;
            document.getElementById('voice-messages').appendChild(audioElement);
        };

        if (isInitiator) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            signalingChannel.send({ offer: offer });
        }

        document.getElementById('endCall').addEventListener('click', () => {
            peerConnection.close();
            signalingChannel.socket.close();
            console.log('Call ended');
        });
    }

    $(document).ready(function() {
        $('#search').click(function() {
            var query = $('#query').val().trim();
            if (!query.match(/^[a-zA-Z0-9_@. ]+$/)) {
                $('#result-container').html('<p>Invalid search query.</p>');
                return;
            }
            $.ajax({
                url: '/search_user/',
                method: 'GET',
                data: { 'query': query },
                success: function(data) {
                    if (data.error) {
                        $('#result-container').html('<p>' + data.error + '</p>');
                    } else {
                        $('#result-container').empty();
                        
                        data.forEach(function(user, index) {
                            var iframeId = 'iframe_' + index;
                            var iframeSrc = 'data:text/html;charset=utf-8,' + encodeURIComponent(generateUserHtml(user));
                            var iframeHtml = '<iframe id="' + iframeId + '" class="user-iframe" src="' + iframeSrc + '"></iframe>';
                            
                            $('#result-container').append(iframeHtml);
                            
                            $('#' + iframeId).data('user', user);
                        });
                    }
                },
                error: function(xhr) {
                    $('#result-container').html('<p>Error: ' + xhr.responseText + '</p>');
                }
            });
        });

        $(document).on('click', '.user-iframe', function() {
            var user = $(this).data('user');
            openVoiceBox(user.username);
        });

        function openVoiceBox(recipientUsername) {
            const senderUsername = "YOUR_USERNAME"; // Replace with the authenticated user's username
            handleCall(true, senderUsername, recipientUsername);
        }

        function generateUserHtml(user) {
            var resultHtml = '<p>Username: ' + user.username + '</p>';
            resultHtml += '<p>Name: ' + user.name + '</p>';
            resultHtml += '<p>Email: ' + user.email + '</p>';
            resultHtml += '<p>Relationship Status: ' + user.relationship_status + '</p>';
            resultHtml += '<p>Sexual Orientation: ' + user.sexual_orientation + '</p>';
            resultHtml += '<p>Race: ' + user.race + '</p>';
            resultHtml += '<p>Phone Number: ' + user.phone_number + '</p>';
            resultHtml += '<p>Social Media API: ' + user.social_media_api + '</p>';
            resultHtml += '<p>Birth Date: ' + user.birth_date + '</p>';
            if (user.profile_video) {
                resultHtml += '<p>Profile Video: <a href="' + user.profile_video + '">View</a></p>';
            }
            if (user.location) {
                resultHtml += '<p>Location: ' + user.location + '</p>';
            }
            if (user.tweet) {
                resultHtml += '<p>Tweet: <img src="' + user.tweet + '" alt="Tweet Image"></p>';
            }
            if (user.video) {
                resultHtml += '<p>Video: <a href="' + user.video + '">Watch</a></p>';
            }
            if (user.image) {
                resultHtml += '<p>Image: <img src="' + user.image + '" alt="Profile Image"></p>';
            }
            return resultHtml;
        }

        $('#startCall').click(function() {
            const recipientUsername = "RECIPIENT_USERNAME"; // Replace with the recipient's username
            const senderUsername = "YOUR_USERNAME"; // Replace with the authenticated user's username
            handleCall(true, senderUsername, recipientUsername);
        });
    });
}

// Function to create a voice message element
function createVoiceMessage(sender, audioBlob) {
    const messageElement = document.createElement('li');
    messageElement.classList.add('voice-message');

    if (sender) {
        const senderElement = document.createElement('span');
        senderElement.textContent = sender + ': ';
        messageElement.appendChild(senderElement);
    }

    const audioElement = document.createElement('audio');
    audioElement.controls = true;
    audioElement.src = URL.createObjectURL(audioBlob);

    messageElement.appendChild(audioElement);

    return messageElement;
}

// Function to handle receiving a voice message
function onReceiveVoiceMessage(sender, audioBlob) {
    const messageContainer = document.getElementById('voice-messages');
    const messageElement = createVoiceMessage(sender, audioBlob);
    messageContainer.appendChild(messageElement);
}

// Function to handle recording a voice message
async function startRecording() {
    try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(mediaStream);

        const audioBlobs = [];
        mediaRecorder.ondataavailable = (event) => audioBlobs.push(event.data);
        mediaRecorder.onstop = () => {
            const recordedBlob = new Blob(audioBlobs, { type: 'audio/webm' });
            onReceiveVoiceMessage(null, recordedBlob);
            mediaRecorder.start();
        };

        mediaRecorder.start();
    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeVoiceMessaging();

    document.getElementById('record-button').addEventListener('click', startRecording);
});

