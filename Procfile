web: cd backend && gunicorn config.wsgi --workers 2 --bind 0.0.0.0:$PORT
release: cd backend && python3.12 manage.py migrate --noinput && python3.12 manage.py collectstatic --noinput
