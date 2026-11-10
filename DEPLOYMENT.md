# Production deployment

This project deploys the backend to Render and the frontend to Vercel. Deploy the
backend first because the frontend needs its public API URL.

## 1. Prepare MongoDB Atlas

1. Create a dedicated least-privilege database user in MongoDB Atlas.
2. Add the Render outbound IP policy required by your Atlas plan. For a learning
   deployment, Atlas may require allowing `0.0.0.0/0`; use a strong database
   password and restrict access later if fixed egress is available.
3. Copy the SRV connection string. URL-encode special characters in the username
   or password.

## 2. Deploy the backend to Render

Create a new Render Web Service from this repository. The included `render.yaml`
can be used with Render Blueprint deployment. If configuring manually:

```text
Root directory: backend
Build command: npm ci
Start command: npm start
Health check path: /health
```

Set these environment variables in Render:

```text
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=url_shortener
JWT_SECRET=<at least 32 random characters>
PUBLIC_BASE_URL=https://<your-render-service>.onrender.com
FRONTEND_ORIGIN=https://<your-vercel-app>.vercel.app
```

`PORT` is supplied by Render and should not be hard-coded in the dashboard.
`FRONTEND_ORIGIN` accepts comma-separated origins when a custom domain and the
Vercel domain both need access.

Verify:

```bash
curl https://<your-render-service>.onrender.com/health
```

Expected response:

```json
{ "data": { "status": "ok" } }
```

## 3. Deploy the frontend to Vercel

Import the repository into Vercel and set:

```text
Root directory: frontend
Build command: npm run build
Output directory: dist
```

Add this environment variable:

```text
VITE_API_BASE_URL=https://<your-render-service>.onrender.com
```

The included `frontend/vercel.json` rewrites client-side routes such as
`/auth` and `/dashboard` to `index.html`. Redeploy after setting the variable.

## 4. Production smoke test

1. Open the Vercel URL.
2. Register a new account with a strong password.
3. Create a link with a customer name and custom short code.
4. Open the short URL and confirm it redirects.
5. Confirm the dashboard shows the link and click count.
6. Sign out and confirm `/dashboard` redirects to `/auth`.
7. Test a duplicate custom code and confirm it returns a conflict error.
8. Confirm Render logs show no startup, database, or CORS errors.

## Security and operations notes

- Never commit `.env` files, Atlas credentials, or JWT secrets.
- Rotate the MongoDB password and JWT secret if they were ever exposed.
- The current rate limiter is process-local. It protects a single instance, but
  Stage 4 should move rate-limit state to Redis before running multiple instances.
- Click counts are currently synchronous. Stage 5 should move analytics to a
  queue and add retention, privacy, and failure-retry policies.
- Keep the `/health` endpoint public for Render health checks.
- Use HTTPS URLs for `PUBLIC_BASE_URL`, `FRONTEND_ORIGIN`, and `VITE_API_BASE_URL`.
