import asyncio
from typing import Dict, Optional, Union

from channels.db import database_sync_to_async
from match.models import Match1v1

from .match_types import MatchType
from tournament.models.tournament_match import TournamentMatch

import logging

logger = logging.getLogger(__name__)

@database_sync_to_async
def get_match(match_type: MatchType, match_id: str):
    # Mapping of MatchType to their corresponding Django models
    match_type_to_model: Dict[MatchType, Union[Match1v1, TournamentMatch]] = {
        MatchType.PVP: Match1v1,
        MatchType.TOURNAMENT: TournamentMatch
    }
    match_model = match_type_to_model[match_type]

    match = None
    try:
        match = match_model.objects.select_related('player_1', 'player_2').get(id=match_id)
    except match_model.DoesNotExist:
        logger.info(f"Match with id {match_id} does not exist in {match_model.__name__} table")
        return None
    if match.is_played:
        logger.info(f"Match with id {match_id} is already played")
        return None
    return match
