from .views import Match1v1ViewSet

def register_with_router(router):
	"""
	Register the UserAccountViewSet with the given router.
	"""
	router.register(r'matches', Match1v1ViewSet, basename='match')
