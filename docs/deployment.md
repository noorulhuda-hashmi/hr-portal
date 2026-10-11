# Putting the HR Portal online (Render + MongoDB Atlas)

The server also serves the React build when `NODE_ENV=production`, so one service is enough.

## Before you start
1. Put the project on GitHub (the `.gitignore` already keeps `.env` and `node_modules` out).
2. In MongoDB Atlas: Network Access must allow the host. Render has no fixed IP, so use `0.0.0.0/0`
   and rely on a strong database password.
3. Use a NEW long random `JWT_SECRET` for production (not the one used on your PC).

## Render (free web service)
- New > Web Service > connect the GitHub repo.
- Build command: `npm run install:all && npm run build`
- Start command: `npm start`
- Environment variables:
  - `NODE_ENV` = `production`
  - `MONGO_URI` = your Atlas connection string (database name `hr_portal`)
  - `JWT_SECRET` = a long random text (at least 16 characters, 40+ is better)
  - `JWT_EXPIRES_IN` = `7d`
  - `LATE_AFTER` = `09:15`
  - `CLIENT_URL` = the web address Render gives you (https://your-app.onrender.com)
- Open `https://your-app.onrender.com/api/health`: it should show `"db":"connected"`.

## Creating the first admin (once)
`/api/auth/register` is admin-only, so the very first admin is created with the seed script.
On your own PC, in the `server` folder, put these in `server/.env` temporarily and run `npm run seed`:
```
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=a-strong-password-8+
```
(It uses the `MONGO_URI` of that .env, so point it at the production database for this one run.)
Then delete the two ADMIN_ lines. Change the password later from the Password page.

## Docker (optional)
`docker build -t hr-portal .` then `docker run -p 5000:5000 --env-file server/.env -e NODE_ENV=production hr-portal`

## Good to know
- Render's free service sleeps when idle; the first page load after a pause takes about a minute.
- Documents are stored inside MongoDB (2 MB limit each). Atlas free tier has 512 MB in total.
- Rate limits: 20 login attempts and 1000 requests per 15 minutes per IP.
- Backups: the free Atlas tier has no automatic backups. Export important data before big changes.
