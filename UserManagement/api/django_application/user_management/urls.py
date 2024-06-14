from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from django.views.generic.base import RedirectView
from rest_framework.routers import DefaultRouter

from people.views.oauth2 import FortyTwoIntraLogin, FortyTwoIntraLoginCallback
from users.urls import register_with_router as register_user_with_router
from user_profile.urls import register_with_router as register_profile_with_router

router = DefaultRouter()
register_user_with_router(router)
register_profile_with_router(router)

urlpatterns = [
    path('', RedirectView.as_view(url='/api/v1/')),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    # TODO: remove /v1 from path
    path('api/v1/',
        include([
            # TODO: remove its only till frontend changed
            path('signup/', RedirectView.as_view(url='/api/v1/users/'), name='signup'),
            path('user/', RedirectView.as_view(url='/api/v1/users/'), name='user'),
    

            path('users/', include('users.urls')),
            path('', include('user_login.urls')),
            # 42 Intra login
            path('oauth_login/', FortyTwoIntraLogin, name='oauth_login'),
            # 42 Intra login callback
            path('call_back/',FortyTwoIntraLoginCallback, name='oauth_callback'),
            ]
        )
    ),
    path('api/v1/',include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
