# Manual Tasks - Reserva

These items require manual action and cannot be automated by a code agent.

## 1. Email / SMTP setup (required for forgot password to actually send emails)

- The forgot password flow generates a reset token and logs it to the console in development.
- To enable real email sending, set these environment variables in `backend/.env`:
  - `EMAIL_HOST` - e.g. smtp.gmail.com
  - `EMAIL_PORT` - e.g. 587
  - `EMAIL_HOST_USER` - your email address
  - `EMAIL_HOST_PASSWORD` - your app password
  - `EMAIL_USE_TLS=True`
- `backend/config/settings/production.py` is already configured to read SMTP settings from the environment.

## 2. reCAPTCHA setup

- Add `VITE_RECAPTCHA_SITE_KEY=your_site_key` to `frontend/.env`.
- Add `RECAPTCHA_SECRET_KEY=your_secret_key` to `backend/.env`.
- Get keys from: https://www.google.com/recaptcha/admin

## 3. Production database connection

- `backend/.env` currently contains only a commented placeholder: `# DATABASE_URL=postgres://...`.
- To connect local development to the online Postgres database, add the real production database credentials to `backend/.env`:
  - `DATABASE_URL=postgres://...`
  - or `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and optionally `DB_PORT`.
- `backend/config/settings/local.py` now uses those credentials automatically when they are present.
- Run `python manage.py migrate` after connecting.

## 4. Leaflet map - business lat/lng data

- For the map to show a pin, each business must have `latitude` and `longitude` values in the database.
- Existing businesses may need their coordinates updated manually via Django admin or a script.
- Django admin URL: http://127.0.0.1:8000/admin/

## 5. Re-seeding demo data after migration wipes

- If local demo data (businesses, services, staff) is lost after migrations, run:
  - `python manage.py seed_demo_data`
- This recreates the local "New Life" business, two services, Tim as staff, and weekly business hours.

## 6. Footer/static pages - real content

- All 16 footer pages (Features, Pricing, About, Blog, etc.) currently have placeholder content.
- Real content needs to be written and added manually.

## 7. Deploying backend to production

- Ensure all new migrations are applied to the production database:
  - `python manage.py migrate --settings=config.settings.production`
- Ensure new environment variables (if any) are set in the production environment (Vercel / Railway / Render / etc.).
