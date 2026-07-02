# Reserva Biz — `biz.reserva.services`

Standalone business-onboarding app (separate Vite build), sharing the same
Django backend as the customer app.

## Run locally

```bash
cd biz
cp .env.example .env      # fill in VITE_GOOGLE_CLIENT_ID (and API base URL)
npm install
npm run dev               # http://localhost:3000
```

Dev runs on **port 3000** so it matches the Google "Authorized JavaScript
origins" entry `http://localhost:3000`.

## Auth flow

- **Register** (`/register`) → `POST /api/auth/business/register/`
  Manual only (Full name, Business name, Email, Phone, Password). No social
  sign-up. New accounts are **unapproved** until an admin approves them.
- **Login** (`/login`)
  - Email/password → `POST /api/auth/login/` (shared endpoint).
  - "Sign in with Google" → `POST /api/auth/business/google/` — succeeds
    **only** for existing, **approved** `business_owner` accounts; otherwise it
    fails with *"No business account found with this email. Please register
    your business manually first."* and never creates an account.

## Deploy (Vercel)

Create a **separate** Vercel project with **Root Directory = `biz`**, add the
domain `biz.reserva.services`, and set env vars: `VITE_API_BASE_URL`,
`VITE_GOOGLE_CLIENT_ID`, `VITE_RECAPTCHA_SITE_KEY`. Add
`https://biz.reserva.services` (and `http://localhost:3000`) to the Google
OAuth client's Authorized JavaScript origins.
