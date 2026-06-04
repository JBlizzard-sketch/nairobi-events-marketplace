# Nairobi Events Marketplace — Deployment Guide

This document covers three deployment paths: local development, VPS (Ubuntu), and cloud (Railway recommended for full-stack, Vercel for frontend-only preview). Choose the one that fits your situation.

---

## 1. Local Development

### Prerequisites
- **Node.js 24** (use [nvm](https://github.com/nvm-sh/nvm): `nvm install 24 && nvm use 24`)
- **pnpm 9+** (`npm i -g pnpm`)
- **PostgreSQL 15+** running locally (or a hosted connection string)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/JBlizzard-sketch/nairobi-events-marketplace.git
cd nairobi-events-marketplace

# 2. Install all workspace dependencies
pnpm install

# 3. Copy and fill in environment variables
cp artifacts/api-server/.env.example artifacts/api-server/.env
cp artifacts/web/.env.example artifacts/web/.env
```

### Environment variables

**`artifacts/api-server/.env`**

```env
# PostgreSQL connection string (required)
DATABASE_URL=postgresql://user:password@localhost:5432/nairobi_events

# Clerk secret key — from https://dashboard.clerk.com (required)
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...

# Session secret (any random 32+ char string)
SESSION_SECRET=change_me_to_something_random_and_long

# Port (default 8080 in dev)
PORT=8080

# AI budget advisor — uses Replit AI credits in Replit env; set an OpenAI key for self-hosted
OPENAI_API_KEY=sk-...

# Optional: real Stripe integration
STRIPE_SECRET_KEY=sk_live_...

# Optional: email transport (leave blank to use console logging in dev)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM="Nairobi Events <noreply@example.com>"
```

**`artifacts/web/.env`**

```env
# Clerk publishable key (required)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# Optional: real Stripe publishable key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Run database migrations

```bash
pnpm --filter @workspace/db run push
```

### Start all services (3 terminals)

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Vite frontend (port 5173)
pnpm --filter @workspace/web run dev

# Terminal 3 — (optional) mockup sandbox (port 8081)
pnpm --filter @workspace/mockup-sandbox run dev
```

Open `http://localhost:5173` in your browser.

> **Note**: The frontend proxies API requests to `:8080` via Vite's dev server config. No extra setup needed.

---

## 2. VPS / Ubuntu Deployment (Recommended for Self-Hosting)

This gives you full control over the stack. Estimated time: ~30 minutes on a fresh Ubuntu 22.04 droplet.

### Recommended specs
- **2 vCPU / 2 GB RAM minimum** (DigitalOcean, Hetzner, Linode, AWS EC2 t3.small, etc.)
- Ubuntu 22.04 LTS
- Domain name pointed at the server's IP

### Step 1 — Server prep

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx certbot python3-certbot-nginx
```

### Step 2 — Node.js 24 via nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 24 && nvm use 24 && nvm alias default 24
npm install -g pnpm pm2
```

### Step 3 — PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE USER nairobi_events WITH PASSWORD 'your_strong_password';"
sudo -u postgres psql -c "CREATE DATABASE nairobi_events OWNER nairobi_events;"
```

### Step 4 — Deploy the application

```bash
# As your deploy user (not root)
git clone https://github.com/JBlizzard-sketch/nairobi-events-marketplace.git /opt/nairobi-events
cd /opt/nairobi-events

# Install dependencies
pnpm install --frozen-lockfile

# Build all packages
pnpm run build

# Set up environment variables
nano artifacts/api-server/.env    # Fill in DATABASE_URL, CLERK_SECRET_KEY, SESSION_SECRET, etc.

# Run DB migrations
pnpm --filter @workspace/db run push

# (Re)build the frontend with production env
nano artifacts/web/.env           # Fill in VITE_CLERK_PUBLISHABLE_KEY
pnpm --filter @workspace/web run build
```

### Step 5 — PM2 process manager

```bash
# Start the API server with PM2
pm2 start "pnpm --filter @workspace/api-server run start" --name nairobi-api --cwd /opt/nairobi-events

# Save process list so it survives reboots
pm2 save
pm2 startup   # Follow the printed instructions to enable autostart
```

### Step 6 — Nginx reverse proxy

Create `/etc/nginx/sites-available/nairobi-events`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend static files (built Vite output)
    root /opt/nairobi-events/artifacts/web/dist;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # SPA fallback — all other paths serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nairobi-events /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Step 7 — HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl reload nginx
```

Certbot auto-renews certs — no further action needed.

### Updating the application

```bash
cd /opt/nairobi-events
git pull origin main
pnpm install --frozen-lockfile
pnpm run build
pnpm --filter @workspace/db run push   # if schema changed
pm2 restart nairobi-api
```

---

## 3. Automated CI/CD — GitHub Actions → Railway

Every push to `main` automatically:
1. Runs the full typecheck (`pnpm run typecheck`)
2. Only if typecheck passes, builds all packages and deploys to Railway
3. Sends a GitHub Actions failure notification if the deploy step fails

This is wired in `.github/workflows/ci.yml`. PRs only run the typecheck; the deploy job is skipped.

### Required GitHub secrets and variables

Go to **GitHub → your repo → Settings → Secrets and variables → Actions** and add:

| Name | Kind | Value |
|---|---|---|
| `RAILWAY_TOKEN` | **Secret** | Your Railway API token (Railway dashboard → Account → Tokens) |
| `RAILWAY_API_SERVICE` | Variable (optional) | Railway service name for the API (default: `api-server`) |
| `RAILWAY_WEB_SERVICE` | Variable (optional) | Railway service name for the frontend (default: `web`) |

### Getting your Railway token

1. Log in at https://railway.app
2. Click your avatar → **Account Settings** → **Tokens**
3. Click **New Token**, name it `GitHub Actions`, copy the value
4. Paste it as the `RAILWAY_TOKEN` secret in GitHub

### Deployment flow

```
git push origin main
  └── GitHub Actions
        ├── typecheck job   (runs on push + PRs)
        └── deploy job      (push to main only, needs: typecheck)
              ├── pnpm install + pnpm run build
              ├── railway up --service api-server --detach
              └── railway up --service web --detach
```

### Failure notifications

GitHub Actions emails the committer automatically when a workflow fails (if email notifications are enabled in your GitHub settings). The deploy job also prints the failed-run URL to the workflow log as a warning, making it easy to find from the Actions tab.

---

## 4. Railway (Easiest Cloud Deployment)

[Railway](https://railway.app) can deploy the entire stack from the GitHub repo with minimal config. **Best choice if you want cloud deployment without managing servers.**

### Why Railway over Vercel for this app?

This app has an **Express 5 API** with a long-running PostgreSQL connection. Vercel's serverless functions have cold starts, connection pooling constraints, and 10 s timeout limits that don't suit this architecture. Railway runs it as a persistent server, exactly like VPS — with zero infrastructure management.

### Steps

1. **Create a Railway project** at https://railway.app/new
2. **Connect your GitHub repo**: `JBlizzard-sketch/nairobi-events-marketplace`
3. **Add a PostgreSQL plugin** from the Railway dashboard — it provisions a DB and sets `DATABASE_URL` automatically.
4. **Add a service** for the API server. In its settings set:
   - **Start command**: `pnpm --filter @workspace/api-server run start`
   - **Build command**: `pnpm install && pnpm run build`
   - **Port**: `8080`
5. **Environment variables** (in Railway → Variables tab):
   ```
   DATABASE_URL          # auto-set by PostgreSQL plugin
   CLERK_SECRET_KEY      sk_live_...
   SESSION_SECRET        <random 32+ chars>
   OPENAI_API_KEY        sk-...        (for AI budget advisor)
   STRIPE_SECRET_KEY     sk_live_...   (optional)
   SMTP_HOST / SMTP_*    (optional email)
   ```
6. **Add a second service** for the frontend:
   - **Build command**: `pnpm install && pnpm --filter @workspace/web run build`
   - **Start command**: `npx serve artifacts/web/dist -l $PORT`
   - **Environment variables**: `VITE_CLERK_PUBLISHABLE_KEY=pk_live_...`
7. **Custom domain**: In Railway → Networking → add your domain and point your DNS CNAME to the provided URL.

Railway handles SSL automatically.

---

## 4. Vercel (Frontend Only)

If you want to host **only the React frontend** on Vercel (e.g. with the API hosted on Railway or VPS):

```bash
# Install Vercel CLI
npm i -g vercel

cd artifacts/web
vercel
```

Set the following in Vercel project settings:
- **Framework preset**: Vite
- **Build command**: `cd ../.. && pnpm install && pnpm --filter @workspace/web run build`
- **Output directory**: `dist`
- **Environment variables**:
  ```
  VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
  VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...   (optional)
  ```

Update `artifacts/web/vite.config.ts` to proxy `/api` to your hosted API URL for production:

```ts
server: {
  proxy: {
    '/api': {
      target: 'https://your-api.railway.app',
      changeOrigin: true,
    },
  },
},
```

---

## Clerk Authentication Setup (All Environments)

1. Create a Clerk application at https://clerk.com
2. In Clerk dashboard → **API Keys**: copy `Publishable Key` and `Secret Key`
3. In Clerk dashboard → **Allowed redirect URLs**: add your production domain
   - `https://yourdomain.com/sign-in/sso-callback`
   - `https://yourdomain.com/sign-up/sso-callback`
4. Enable **Email/Password** and **Google OAuth** sign-in methods
5. Set your app's logo and name in Clerk → **Customization → Branding**

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend secret |
| `CLERK_PUBLISHABLE_KEY` | ✅ (API) | Clerk publishable key for the API |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ (web) | Clerk publishable key for the frontend |
| `SESSION_SECRET` | ✅ | Random 32+ character secret |
| `OPENAI_API_KEY` | ⚠️ optional | Enables AI budget advisor |
| `STRIPE_SECRET_KEY` | ⚠️ optional | Real Stripe payments (mock used if absent) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ⚠️ optional | Stripe frontend key |
| `SMTP_HOST` | ⚠️ optional | Email transport host |
| `SMTP_PORT` | ⚠️ optional | Email transport port (default 587) |
| `SMTP_SECURE` | ⚠️ optional | `true` for port 465, `false` for 587 |
| `SMTP_USER` | ⚠️ optional | SMTP username |
| `SMTP_PASS` | ⚠️ optional | SMTP password |
| `SMTP_FROM` | ⚠️ optional | From address, e.g. `"App <noreply@domain.com>"` |

---

## Health Check

Once deployed, verify the API is running:

```bash
curl https://yourdomain.com/api/healthz
# Expected: {"status":"ok","timestamp":"..."}
```

If the health check returns 502, check PM2 logs (`pm2 logs nairobi-api`) or Railway logs in the dashboard.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Blank page after deploy | Missing `VITE_CLERK_PUBLISHABLE_KEY` | Add env var and rebuild |
| 401 on all API calls | Missing/wrong `CLERK_SECRET_KEY` | Check key matches your Clerk app |
| 500 on DB queries | `DATABASE_URL` wrong or DB not migrated | Run `pnpm --filter @workspace/db run push` |
| Emails not sending | `SMTP_*` vars missing | Add SMTP config or leave blank (logs to console) |
| AI advisor returns error | `OPENAI_API_KEY` missing | Add key or feature gracefully degrades |
