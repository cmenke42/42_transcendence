from enum import Enum
from typing import Optional

class MatchType(Enum):
    """
    Different match types of the pong game.
    """
    TOURNAMENT = "tournament"
    PVP = "1v1"

    @classmethod
    def from_string(cls, match_type_str: str) -> Optional['MatchType']:
        for match_type in cls:
            if match_type.value == match_type_str:
                return match_type
        return None

    @classmethod
    def to_string(cls, match_type: 'MatchType') -> str:
        return match_type.value
