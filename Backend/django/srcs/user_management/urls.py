from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from django.views.generic.base import RedirectView
from rest_framework.routers import DefaultRouter

from users.urls import register_with_router as register_user_with_router
from user_profile.urls import register_with_router as register_profile_with_router
from tournament.urls import register_with_router as register_tournament_with_router
from match.urls import register_with_router as register_match_with_router
from user_management.oauth2 import FortyTwoIntraLogin, FortyTwoIntraLoginCallback
from user_management.oauth2  import ExchangeCodeView
from user_management.oauth2Google import GoogleLogin, GoogleLoginCallback
from user_management.utils import avatar_proxy
from user_management.utils import HealthCheckView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

router = DefaultRouter()
register_user_with_router(router)
register_profile_with_router(router)
register_tournament_with_router(router)
register_match_with_router(router)

urlpatterns = [
    path('', RedirectView.as_view(url='/api/v1/')),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'), #https://10.12.10.5:6010/api/schema/swagger-ui/
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),             #https://10.12.10.5:6010/api/schema/redoc/
    # TODO: remove /v1 from path
    path('api/v1/',
        include([
            # TODO: remove its only till frontend changed
            path('signup/', RedirectView.as_view(url='/api/v1/users/'), name='signup'),
            path('user/', RedirectView.as_view(url='/api/v1/users/'), name='user'),
            path('', include('chat.urls')),
            path('users/', include('users.urls')),
            path('', include('user_login.urls')),

            path('oauth_login/', FortyTwoIntraLogin, name='oauth_login'),
            path('oauth_google_login/', GoogleLogin, name='oauth_login'),
            path('call_back/',FortyTwoIntraLoginCallback, name='oauth_callback'),   
            path('google_call_back/',GoogleLoginCallback, name='oauth_callback'),       
            path('exchange-code/', ExchangeCodeView.as_view(), name='exchange_code'),
            path('profile/', include('user_profile.urls')),
            path('avatar-proxy/', avatar_proxy, name='avatar_proxy'),
            path('healthcheck/', HealthCheckView, name='healthcheck'),
            ]
        )
    ),
    path('api/v1/',include(router.urls)),
    
]
# + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
#urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)