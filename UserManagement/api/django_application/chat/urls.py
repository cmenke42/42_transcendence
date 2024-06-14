from django.urls import path

from . import views

urlpatterns = [
	path("chat/",name="index"),
]