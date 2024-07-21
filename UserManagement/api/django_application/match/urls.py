from django.urls import path
from .views import MatchView

""" def match_1v1(router):
    router.register(r'match1v1', MatchView, basename='match1v1')
    urlpatterns = router.urls """

# GET Method http://localhost:8000/api/v1/match/list/ checks if a match is remaining
urlpatterns = [
    path('list/', MatchView, name='match'),
]


