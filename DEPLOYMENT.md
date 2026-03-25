# Centrika OnePortal — Setup & Deployment

**Version:** 1.0  
**Last Updated:** March 25, 2026  
**Maintained by:** Engineering Team

---

## What You Need

- **Node.js** 18 or higher  
- **pnpm** 8 or higher  
- **PostgreSQL** 14 or higher  
- **Redis** 6+ *(optional — the app works fine without it)*

---

## Folder Layout

Both projects live side by side in one parent folder. This is required because the frontend pulls type definitions directly from the backend source.

```
Centrika-workflow/
├── backend/        ← Express + tRPC API
├── frontend/       ← Vite + React app
└── DEPLOYMENT.md
```

---

## Getting Started

### 1. Clone

```bash
git clone <backend-repo-url> backend
git clone <frontend-repo-url> frontend
```

### 2. Backend

```bash
cd backend
pnpm install
```

Create a file called `.env` in the backend root:

```env
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/centrika_dev
JWT_SECRET=pick-a-strong-random-secret

VITE_APP_ID=local-dev-app
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:5173

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=centrikaoneportal@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Centrika <centrikaoneportal@gmail.com>
```

Set up the database:

```bash
npx prisma generate
npx prisma db push
```

Start the server:

```bash
pnpm run dev
```

Backend runs on **port 3001**.

---

### 3. Frontend

```bash
cd frontend
pnpm install
```

Create a file called `.env.local` in the frontend root:

```env
VITE_API_URL=http://localhost:3001
VITE_APP_ID=local-dev-app
VITE_APP_LOGO=/logo/centrikaLogo.png
VITE_APP_TITLE=Centrika OnePortal
VITE_OAUTH_PORTAL_URL=
```

Start the app:

```bash
pnpm run dev
```

Frontend runs on **port 5173**. Open `http://localhost:5173` in the browser and you should see the login screen.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | What it does |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signs session cookies — pick something random and keep it secret |
| `VITE_APP_ID` | App identifier — must match the frontend value |
| `FRONTEND_URL` | The URL where the frontend is running — controls CORS |
| `APP_URL` | The URL users access in their browser — used in email links |
| `EMAIL_HOST` | SMTP host (default: `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (default: `587`) |
| `EMAIL_USER` | Your email/SMTP username |
| `EMAIL_PASSWORD` | Your email app password |
| `EMAIL_FROM` | Display name in outgoing emails |
| `PORT` | Backend port (default: `3001`) |

### Frontend — `frontend/.env.local`

| Variable | What it does |
|----------|-------------|
| `VITE_API_URL` | Where the backend is running |
| `VITE_APP_ID` | Must match the backend `VITE_APP_ID` |
| `VITE_OAUTH_PORTAL_URL` | Leave empty to use email/password login |

---

## Things That Trip People Up

**"I log in but never reach the dashboard"**  
→ Check that `FRONTEND_URL` in the backend `.env` matches exactly where your frontend is running (including the port). CORS will block the session cookie otherwise.

**"CORS error in the console"**  
→ Same fix. The backend only allows origins listed in `FRONTEND_URL`. You can add multiple separated by commas: `http://localhost:5173,http://localhost:5174`

**"Database connection failed"**  
→ Make sure PostgreSQL is running and your `DATABASE_URL` credentials are correct.

**"PrismaClient is not generated"**  
→ Run `npx prisma generate` inside the backend folder.

**"Cannot find module '../../../backend/src/router'"** (frontend build error)  
→ The `backend/` and `frontend/` folders must be siblings in the same parent directory.

**"Redis caching disabled" warning**  
→ This is normal. Redis is optional — OTP codes are stored in the database instead.

---

## Deploying to Production

### Build

```bash
# Backend
cd backend
pnpm run build
pnpm run start          # runs dist/index.js

# Frontend
cd frontend
pnpm run build          # outputs to dist/
```

Serve the frontend `dist/` folder with any web server (Nginx, Caddy, etc.).

### Nginx — Frontend

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/frontend/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Nginx — Backend (reverse proxy)

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Cookies in Production

No code changes needed. When served over HTTPS, cookies automatically switch to `secure: true` and `sameSite: none`. Over HTTP (local dev), they use `sameSite: lax`.

---

## Quick Checklist for New Environments

- [ ] Node.js and pnpm installed
- [ ] PostgreSQL running and accessible
- [ ] Both repos cloned side by side
- [ ] `pnpm install` run in both folders
- [ ] `.env` created in backend with correct `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`
- [ ] `.env.local` created in frontend with correct `VITE_API_URL`
- [ ] `npx prisma generate && npx prisma db push` completed
- [ ] `VITE_APP_ID` matches in both `.env` files
- [ ] Backend starts without errors on port 3001
- [ ] Frontend starts and loads the login page on port 5173
