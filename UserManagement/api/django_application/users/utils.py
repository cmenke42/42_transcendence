from django.conf import settings

def get_base_user_directory_path(user_id):
    """
    Will return the base path where user uploads are stored
    """
    return f"{settings.USER_UPLOADS_ROOT}/{user_id}/"