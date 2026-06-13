# Pizzerio Bites Admin — Premium MERN Console

Admin dashboard for **Pizzerio Bites**: JWT auth, MongoDB Atlas (`pizzerio-bites` database), role-based UI, and full operations modules (menu, orders, reservations, CMS, inventory, analytics, and more).

> **NeonBite Café** is a separate project with its own `neonbite-cafe` database — do not point this app at that database.

## Monorepo layout

- `client/` — React 19 + Vite + Tailwind 4 + Framer Motion + GSAP + Recharts
- `server/` — Express + Mongoose + JWT + rate limits + Multer uploads
- `.env` — **root** environment file (loaded by `server/server.js`)

## Quick start (local)

```bash
cd pizzerio-bites
npm install
npm install --prefix client
npm install --prefix server
```

1. Set `MONGODB_URI` in `.env` to your Atlas URI with database **`pizzerio-bites`**.
2. Set `JWT_SECRET` to a long random string.
3. Optional:
   - `JWT_EXPIRES_IN` — access token lifetime (default `15m` on server)
   - `CLIENT_URL` — comma-separated CORS origins (required in production)
   - `ENABLE_DEFAULT_SEED` — `true` to auto-seed menu defaults in production
4. First-time seed (empty database only):

```bash
npm run seed --prefix server
```

**Required environment variables for seed:**
- `SEED_ADMIN_EMAIL` - Admin user email
- `SEED_ADMIN_PASSWORD` - Admin user password (must meet password policy in production)

5. Run API + UI:

```bash
npm run dev
```

- Admin UI: [http://localhost:5173/login](http://localhost:5173/login)
- API health: [http://localhost:5000/api/health](http://localhost:5000/api/health)

## MongoDB

Example URI:

`mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/pizzerio-bites?retryWrites=true&w=majority`

Data migration from a local backup: see `scripts/ATLAS-SETUP.md` and `npm run db:import`.

## Deploy

### Admin frontend (Vercel / Netlify)

- **Root Directory:** `client`
- **Build:** `npm run build` · **Output:** `dist`
- **Env:** `VITE_API_URL` = your public API URL (no trailing slash)

### API (Render / Railway / Fly.io)

- **Root Directory:** `server`
- **Start:** `npm start`
- **Env:** `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (admin URL for CORS)

## Roles

`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `STAFF`, `DELIVERY_STAFF`

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Client + server concurrently |
| `npm run build` | Production build of the client |
| `npm run start --prefix server` | Start API |
| `npm run seed --prefix server` | Seed admin + categories (empty DB) |
| `npm run db:import` | Restore `backup/pizzerio-bites-seed/` into `NEW_MONGODB_URI` |
| `npm run db:status` | List local backup collections |
