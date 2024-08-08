from .views import TournamentViewSet

def register_with_router(router):
	"""
	Register the UserAccountViewSet with the given router.
	"""
	router.register(r'tournaments', TournamentViewSet, basename='tournament')
