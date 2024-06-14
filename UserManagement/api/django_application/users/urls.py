from django.urls import path
from .views.user_account import UserAccountViewSet, ActivateAccountAPIView
from .views.password_reset import ResetPasswordAPIView, ForgotPasswordAPIView
from .views.change_password import ChangePasswordAPIView
from .views.change_email import ChangeEmailAPIView, ObtainChangeEmailTokenAPIView

def register_with_router(router):
    """
    Register the UserAccountViewSet with the given router.
    """
    router.register(r'users', UserAccountViewSet, basename='user')

urlpatterns = [
    path('activate/', ActivateAccountAPIView.as_view(), name='user-activate'),
    path('forgot-password/', ForgotPasswordAPIView.as_view(), name='user-forgot-password'),
    path('reset-password/', ResetPasswordAPIView.as_view(), name='user-reset-password'),
    path('change-password/', ChangePasswordAPIView.as_view(), name='user-change-password'),
    path('change-email/get-token/', ObtainChangeEmailTokenAPIView.as_view(), name='user-change-email-get-token'),
    path('change-email/', ChangeEmailAPIView.as_view(), name='user-change-email'),
]
