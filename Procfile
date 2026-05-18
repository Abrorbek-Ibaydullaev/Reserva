web: cd backend && DJANGO_SETTINGS_MODULE=config.settings.production gunicorn config.wsgi --workers 2 --bind 0.0.0.0:$PORT
release: cd backend && DJANGO_SETTINGS_MODULE=config.settings.production python3.12 manage.py migrate --noinput && DJANGO_SETTINGS_MODULE=config.settings.production python3.12 manage.py collectstatic --noinput
