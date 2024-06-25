from django.urls import path

from .views import get_chat_message, mark_message_as_read, get_unread_message_counts

urlpatterns = [
	path('get_messages/', get_chat_message, name='get_chat_message'),
	path('mark_message_as_read/', mark_message_as_read, name='mark_message_as_read'),
 	path('get_unread_message_counts/', get_unread_message_counts, name='get_unread_message_counts'),

]
