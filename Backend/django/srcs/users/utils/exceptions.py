from rest_framework.exceptions import APIException
from rest_framework import status

class EmailSendingFailed(Exception):
    """
    Exception raised when sending an email fails.
    """
