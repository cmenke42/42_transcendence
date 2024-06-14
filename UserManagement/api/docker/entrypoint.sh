#!/bin/sh

# Apply database migrations
python manage.py migrate
python manage.py createsuperuser --noinput


# Start server and execute CMDs passed
exec "$@"

# daphne -b 0.0.0.0 -p 8000 user_management.asgi:application