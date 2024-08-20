#!/bin/sh

# Apply database migrations

python /app/django_application/manage.py migrate
python /app/django_application/manage.py createsuperuser --noinput

# Start server and execute CMDs passed
exec "$@"

# daphne -b 0.0.0.0 -p 8000 user_management.asgi:application
