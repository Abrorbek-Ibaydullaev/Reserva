# Reserva — Local Setup & Run Guide

Reserva is a Booksy-style booking platform for the Uzbekistan market.

**Stack:** Django (DRF) backend + React (Vite) frontend + Tailwind CSS.

This archive contains **source code only**. Dependencies, the database, and
uploaded media are not included (to keep the archive small) — they are
rebuilt locally with the steps below.

---

## Prerequisites

- **Python 3.12**
- **Node.js 18+** and npm
- A terminal (macOS / Linux / Windows)

---

## 1. Backend (Django API)

```bash
cd backend

# Create and activate a virtual environment
python3.12 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create the environment file from the template, then edit values
cp .env.example .env

# Create the database schema
python3.12 manage.py migrate

# (Optional) Load the included sample data
python3.12 manage.py loaddata datadump.json

# (Optional) Create an admin user
python3.12 manage.py createsuperuser

# Run the backend on http://localhost:8000
python3.12 manage.py runserver
```

---

## 2. Frontend (React + Vite)

Open a **second terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Create the environment file from the template, then edit values
cp .env.example .env

# Run the frontend on http://localhost:5173
npm run dev
```

Open **http://localhost:5173** in a browser. The frontend talks to the
backend at http://localhost:8000.

---

## 3. Environment variables

The real `.env` files are **not included** in this archive. Copy the
provided `.env.example` templates and fill in your own local values.

### `backend/.env`
| Variable | Notes |
|---|---|
| `SECRET_KEY` | Any random string for local use |
| `DEBUG` | `True` for local development |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` |
| `DB_ENGINE` / `DB_NAME` | SQLite by default (`db.sqlite3`) |
| `CORS_ALLOW_ALL_ORIGINS` | `True` for local |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` |
| `FRONTEND_URL` | `http://localhost:5173` |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_BOT_USERNAME` | Optional — only for the Telegram bot |
| `RECAPTCHA_SECRET_KEY` | Optional — leave blank to skip captcha locally |
| `CLOUDINARY_*` | Optional — only for cloud image storage |

### `frontend/.env`
| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` |
| `VITE_RECAPTCHA_SITE_KEY` | Optional — leave blank to skip captcha locally |

Optional integrations (Telegram bot, reCAPTCHA, Cloudinary) can be left
blank — the core booking app runs without them.

---

## Notes

- Uploaded media (profile/business photos) and the homepage hero video are
  not included, so some images may appear blank. This does not affect
  functionality.
- The database starts empty unless you run `loaddata datadump.json`.
