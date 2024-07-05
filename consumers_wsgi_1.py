import json
from channels.generic.websocket import AsyncWebsocketConsumer

class WebRTCConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get usernames and room name
        try:
            self.sender_username = self.scope['url_route']['kwargs']['sender_username']
            self.recipient_username = self.scope['url_route']['kwargs']['recipient_username']
            self.room_name = f'{self.sender_username}_{self.recipient_username}'
        except KeyError:
            await self.close(code=400, reason="Invalid username(s) provided")
            return

        # Add to room group
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON data'}))
            return

        # Validate data and handle complex types (e.g., SDP, ICE)
        if not self.validate_message_data(data):
            await self.send(text_data=json.dumps({'error': 'Invalid message data'}))
            return

