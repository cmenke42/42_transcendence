from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
from .serializers import MyTokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from users.models import CustomUser
from .serializers import  OTPVerifySerializer
from rest_framework_simplejwt.tokens import RefreshToken
from user_login.otp_service import OTPService
import logging

logger = logging.getLogger(__name__)


from rest_framework_simplejwt.tokens import UntypedToken


# class MyObtainTokenPairView(TokenObtainPairView):
#     permission_classes = (AllowAny,)
#     serializer_class = MyTokenObtainPairSerializer

class MyObtainTokenPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    def post(self, request, *args, **kwargs):
        # First, handle the normal token obtain process
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            print(e) # print the error
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = serializer.user
        
        #check if the user is active
        if not user.is_active:
            return Response({"detail": "User account is not active."}, status=status.HTTP_401_UNAUTHORIZED)

        #check if the user's email is verified
        if not user.is_email_verified:
            return Response({"detail": "User email is not verified."}, status=status.HTTP_401_UNAUTHORIZED)
        
        if user.is_2fa_enabled:
            # Generate and send OTP
            OTPService.generate_otp(user)
            OTPService.send_otp_email(user)
            return Response({
                'detail': '2FA is required. An OTP has been sent to your email.',
                'fa_pending': True,
                'email': user.email
            }, status=status.HTTP_200_OK)
        
        # If 2FA is not enabled, return the token as usual  
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            user = CustomUser.objects.get(email=email)
            # Issue JWT token
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)