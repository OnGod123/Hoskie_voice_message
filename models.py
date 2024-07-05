class Message(models.Model):
    room = models.ForeignKey(Room, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(CustomUser, related_name='sent_messages', on_delete=models.CASCADE)
    recipient = models.ForeignKey(CustomUser, related_name='received_messages', on_delete=models.CASCADE)
    audio_file = models.FileField(upload_to='voice_messages/', null=True, blank=True)  # Field for the audio file
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.audio_file:
            return f'{self.sender} to {self.recipient}: Voice Message'
        return f'{self.sender} to {self.recipient}: {self.content[:20]}'
