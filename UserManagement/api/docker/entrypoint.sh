#!/bin/sh

# Apply database migrations
python manage.py migrate
python manage.py createsuperuser --noinput


# Start server and execute CMDs passed
exec "$@"