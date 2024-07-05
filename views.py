# messaging/views.py

from django.shortcuts import render

def voice_messaging_view(request):
    return render(request, 'voice_messaging.html')

