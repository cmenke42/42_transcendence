from django.db.models import Q
from django_filters import rest_framework as filters

from .models import Match1v1


class BaseMatchFilter(filters.FilterSet):
    player_id = filters.NumberFilter(method='filter_player_id', label="Player ID")
    # player_id = filters.NumberFilter(method='filter_player_id')
    # player_1_id = filters.NumberFilter(method='filter_player_1_id')
    # player_2_id = filters.NumberFilter(method='filter_player_2_id')
    # winner_id = filters.NumberFilter(method='filter_winner_id')
    # is_played = filters.BooleanFilter()

    class Meta:
        abstract = True
        # fields = ['player_id', 'player_1_id', 'player_2_id', 'winner_id', 'is_played']
        fields = ['player_id']

    def filter_player_id(self, queryset, name, value):
        """Filter matches where the player ID is either player_1 or player_2."""
        return queryset.filter(
            Q(player_1=value) | Q(player_2=value)
        )

    # def filter_player_1_id(self, queryset, name, value):
    #     """Filter matches where player_1 has the specified ID."""
    #     return queryset.filter(player_1=value)

    # def filter_player_2_id(self, queryset, name, value):
    #     """Filter matches where player_2 has the specified ID."""
    #     return queryset.filter(player_2=value)

    # def filter_winner_id(self, queryset, name, value):
    #     """Filter matches where the winner has the specified ID."""
    #     return queryset.filter(winner=value)

class Match1v1Filter(BaseMatchFilter):
    class Meta(BaseMatchFilter.Meta):
        model = Match1v1
