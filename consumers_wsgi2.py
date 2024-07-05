 await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'signal_message',
                'message': data,
                'sender': self.sender_username,
                'recipient': self.recipient_username
            }
        )

    async def signal_message(self, event):
        message = event['message']
        sender = event['sender']
        recipient = event['recipient']

        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
            'recipient': recipient
        }))

         message = Message.objects.create(
                room=self.room,
                sender=self.sender,
                recipient=self.recipient,
                # Add content field for text messages (assuming data contains text)
                content=data.get('content', ''),  # Get content from data if present
            )

    def validate_message_data(self, data):
        # Base validation for required fields and data types
        if not isinstance(data, dict) or 'type' not in data or 'data' not in data:
            return False

        # Validate message type (consider adding allowed types to a list)
        if data['type'] not in ['candidate', 'offer', 'answer']:
            return False

        # Implement additional validation based on message type (placeholder)
        if data['type'] == 'candidate':
            # You might check for required fields like 'sdpMLineIndex', 'sdpMid', and 'candidate'
            pass  # Add specific validation for ICE candidates here
        elif data['type'] in ['offer', 'answer']:
            # You might check for required fields like 'sdp' and potentially media content constraints
            pass  # Add specific validation for SDP offers/answers here

        # Consider security checks (e.g., data length limits)

        return True
