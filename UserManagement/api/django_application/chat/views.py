from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.contrib.auth.decorators import login_required
from .models import PrivateChatMessage
from django.contrib.auth.models import User
from user_profile.models import UserProfile
from django.db.models import Q
import json

@login_required
@require_POST
def send_message(request):
    receiver_username = request.POST.get('receiver')
    message = request.POST.get('message')
    receiver = get_object_or_404(User, username=receiver_username)
    chat_message = PrivateChatMessage.objects.create(sender=request.user, receiver=receiver, message=message)
    #notify the receiver
    #this could be done using websocket notification
    return JsonResponse({'status': 'Message sent', 'message_id': chat_message.id})

@login_required
@require_GET
def get_message(request):
    receiver_username=request.GET.get('receiver')
    receiver = get_object_or_404(User, username=receiver_username)
    messages = PrivateChatMessage.objects.filter(sender=request.user, receiver=receiver) | PrivateChatMessage.objects.filter(sender=receiver, receiver=request.user)
    message = messages.order_by('timestamp').values('id', 'sender__username', 'receiver__username', 'message', 'timestamp', 'read')
    return JsonResponse({'message': list(message)})

# @login_required
@require_GET
def get_chat_message(request):
    # print('hello world\n')    
    sender_nickname = request.GET.get('sender')
    receiver_nickname = request.GET.get('receiver')

    sender = get_object_or_404(UserProfile, nickname=sender_nickname)
    receiver = get_object_or_404(UserProfile, nickname=receiver_nickname)
    messages = PrivateChatMessage.objects.filter(
        (Q(sender=sender, receiver=receiver) | Q(sender=receiver, receiver=sender))
        ).order_by('timestamp')
    # print(messages)
    unread_count = PrivateChatMessage.objects.filter(sender=receiver, receiver=sender, is_read=False).count()
    
    message_list = [{
        'sender': message.sender.nickname,
        'receiver': message.receiver.nickname,
        'message': message.message,
        'timestamp': str(message.timestamp),
        'is_read': message.is_read,
    } for message in messages]
    # return JsonResponse({'message': message_list})
    return JsonResponse({'message': message_list, 'unread_count': unread_count})

@require_GET
def get_unread_message_counts(request):
    current_user_nickname = request.GET.get('current_user')
    current_user = get_object_or_404(UserProfile, nickname=current_user_nickname)
    
    other_users = UserProfile.objects.exclude(nickname=current_user_nickname)
    
    unread_counts = {}
    for user in other_users:
        count = PrivateChatMessage.objects.filter(
            sender=user,
            receiver=current_user,
            is_read=False
        ).count()
        unread_counts[user.nickname] = count
    
    return JsonResponse({'unread_counts': unread_counts})

# @login_required
@require_http_methods(['PUT'])
def mark_message_as_read(request):
    data = json.loads(request.body)
    sender_nickname = data.get('sender')
    receiver_nickname = data.get('receiver')
    # sender_nickname = request.POST.get('sender')
    # receiver_nickname = request.POST.get('receiver')
    # print(f'sender: {sender_nickname}, receiver: {receiver_nickname}')
    sender = get_object_or_404(UserProfile, nickname=sender_nickname)
    receiver = get_object_or_404(UserProfile, nickname=receiver_nickname)
    #print(f'sender: {sender}, receiver: {receiver}')
    PrivateChatMessage.objects.filter(
        sender=sender, receiver=receiver, is_read=False
        ).update(is_read=True)
    
    return JsonResponse({'status': 'success'})
