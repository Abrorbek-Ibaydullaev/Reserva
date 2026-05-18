# Reserva — Deployment Guide

This guide explains how to deploy the Reserva platform.
The backend is a Django/DRF application; the frontend is a React/Vite SPA.
They can be deployed together (Django serves the built frontend) or separately.

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.12 |
| Node.js | 18 |
| npm | 9 |
| PostgreSQL | 14 (optional — SQLite works for a demo) |

---

## 1. Clone and prepare the repository

```bash
git clone <your-repo-url>
cd Reserva
```

---

## 2. Backend setup

### 2a. Create a virtual environment and install dependencies

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2b. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

| Variable | What to set |
|----------|-------------|
| `SECRET_KEY` | A long random string (see comment in `.env.example`) |
| `DEBUG` | `False` in production |
| `ALLOWED_HOSTS` | Your domain, e.g. `reserva.uz,www.reserva.uz` |
| `DATABASE_URL` | PostgreSQL URL, e.g. `postgres://user:pass@host/db` |
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather |
| `RECAPTCHA_SECRET_KEY` | Server-side reCAPTCHA v2 secret key |
| `FRONTEND_URL` | Public URL of the deployed frontend |
| `CORS_ALLOW_ALL_ORIGINS` | `False` |
| `CORS_ALLOWED_ORIGINS` | `https://yourdomain.com` |

### 2c. Run migrations and collect static files

```bash
DJANGO_SETTINGS_MODULE=config.settings.production \
  python3.12 manage.py migrate --noinput

DJANGO_SETTINGS_MODULE=config.settings.production \
  python3.12 manage.py collectstatic --noinput
```

### 2d. Start the production server

```bash
DJANGO_SETTINGS_MODULE=config.settings.production \
  gunicorn config.wsgi --workers 2 --bind 0.0.0.0:8000
```

---

## 3. Frontend setup

### 3a. Install dependencies

```bash
cd frontend   # from the repo root: cd ../frontend (if you are still in backend/)
npm install
```

### 3b. Configure environment variables

```bash
cp .env.example .env
```

Set:

| Variable | What to set |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL, e.g. `https://api.reserva.uz/api` |
| `VITE_RECAPTCHA_SITE_KEY` | Your reCAPTCHA v2 site key (public) |

### 3c. Build the production bundle

```bash
npm run build
```

This produces a `dist/` folder with static HTML/JS/CSS.

---

## 4. Deployment options

### Option A — Serve the frontend separately (recommended)

Deploy the `frontend/dist/` folder to a static host:
- **Netlify / Vercel**: drag-and-drop the `dist/` folder or connect the repo.
- **Nginx**: point the document root to `frontend/dist/` and add an SPA fallback:
  ```nginx
  location / {
      root /path/to/Reserva/frontend/dist;
      try_files $uri $uri/ /index.html;
  }
  ```

Deploy the Django backend to any WSGI host (Railway, Render, Heroku, VPS).

### Option B — Heroku / Railway (all-in-one)

The `Procfile` at the repo root is already configured.

```bash
# Heroku example
heroku create reserva-app
heroku config:set SECRET_KEY="..." DEBUG=False ALLOWED_HOSTS="reserva-app.herokuapp.com" ...
git push heroku main
```

The `release` process in the Procfile runs `migrate` and `collectstatic` automatically.

### Option C — VPS with Nginx + Gunicorn

1. Upload the project to your server.
2. Set up the Python virtual environment and install dependencies (step 2a–2b).
3. Run Gunicorn as a systemd service or with `supervisor`.
4. Configure Nginx to:
   - Proxy `/api/`, `/admin/`, `/media/`, `/static/` to Gunicorn (port 8000).
   - Serve the `frontend/dist/` files for all other paths.
5. Obtain a TLS certificate (Let's Encrypt / Certbot).
6. Set `SECURE_SSL_REDIRECT=True` in `.env` once HTTPS is working.

---

## 5. Google reCAPTCHA keys

1. Go to https://www.google.com/recaptcha/admin
2. Create a new site with reCAPTCHA v2 ("I'm not a robot" checkbox).
3. Add your domain to the allowed domains list.
4. Copy the **Site key** into `frontend/.env` as `VITE_RECAPTCHA_SITE_KEY`.
5. Copy the **Secret key** into `backend/.env` as `RECAPTCHA_SECRET_KEY`.

For local development, Google provides always-pass test keys:
- Site key: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- Secret key: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

The backend also auto-skips reCAPTCHA validation when `RECAPTCHA_SECRET_KEY` is
still set to the placeholder value `your-recaptcha-secret-key-here`, so local
development works without any reCAPTCHA configuration at all.

---

## 6. Telegram bot in production

The bot runs as a separate process. Start it alongside the web server:

```bash
cd backend
source venv/bin/activate
DJANGO_SETTINGS_MODULE=config.settings.production python3.12 manage.py run_bot
```

On Heroku/Railway add a second dyno/process in the Procfile:
```
bot: DJANGO_SETTINGS_MODULE=config.settings.production python3.12 backend/manage.py run_bot
```

---

## 7. Quick local smoke test (development)

```bash
# Terminal 1 — backend
cd backend && source venv/bin/activate && python3.12 manage.py runserver

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser.
The reCAPTCHA widget will render using the Google test key (always passes).
