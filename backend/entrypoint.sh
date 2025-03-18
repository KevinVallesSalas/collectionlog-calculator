#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Importing initial data..."
python manage.py import_completion_rates

echo "Starting Gunicorn..."
exec gunicorn collection_log_backend.wsgi:application --bind 0.0.0.0:$PORT
