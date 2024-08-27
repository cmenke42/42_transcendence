from .views import TournamentViewSet, TournamentMatchViewSet

def register_with_router(router):
	"""
	Register the UserAccountViewSet with the given router.
	"""
	router.register(r'tournaments', TournamentViewSet, basename='tournament')
	router.register(r'tournament-matches', TournamentMatchViewSet, basename='tournament-matches')
