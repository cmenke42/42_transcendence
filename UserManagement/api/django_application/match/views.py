from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.viewsets import GenericViewSet

from .filters import BaseMatchFilter, Match1v1Filter
from .models import Match1v1
from .serializers import Match1v1Serializer


class Match1v1ViewSet(
    GenericViewSet,
    ListModelMixin,
    RetrieveModelMixin,
):
    queryset = Match1v1.objects.all().order_by('-id')
    serializer_class = Match1v1Serializer
    filterset_class = BaseMatchFilter
