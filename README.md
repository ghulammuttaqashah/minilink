# Minilink

Minilink is a production-oriented URL shortener built incrementally with the MERN
stack. The project was created as a practical system-design learning exercise:
the first version is a deployable modular monolith, while the roadmap documents
how to evolve it with Redis, distributed rate limiting, queues, horizontal
scaling, and load testing.

## Live deployment

- Frontend: https://minilink-xi.vercel.app/
- Backend: https://minilink-013c.onrender.com
- Health check: https://minilink-013c.onrender.com/health

## Features

- Create short URLs from long HTTP/HTTPS URLs.
- Optional customer or campaign name.
- Optional custom short code with uniqueness validation.
- JWT authentication with bcrypt password hashing.
- Password requirements with live UI feedback:
  - minimum eight characters
  - uppercase letter
  - lowercase letter
  - number
- User-owned URL dashboard.
- Anonymous URL creation using a random ownership token.
- Customer name, short-code, and destination search.
- Click, customer-name, and no-click filters.
- Newest, oldest, and most-clicked sorting.
- Seven-day click history stored as timestamps.
- Interactive compact activity graph.
- Detailed analytics modal with daily click graph and dates.
- Protected URL deletion with an in-app confirmation modal.
- Loading states, skeleton table rows, errors, empty states, and responsive dark UI.
- Helmet security headers, CORS validation, JSON body limits, and rate limiting.
- Render health endpoint and Vercel SPA route rewrites.

## Technology

### Frontend

- React 19
- React Router
- Vite
- Tailwind CSS browser CDN

### Backend

- Node.js
- Express 5
- Mongoose
- MongoDB Atlas
- JWT
- bcryptjs
- Helmet
- CORS
- express-rate-limit

### Deployment and tooling

- Render for the backend
- Vercel for the frontend
- GitHub for source control
- Postman for API exploration
- Node's built-in test runner and Supertest
- `test-rate-limit.cjs` for rate-limit smoke testing

## Repository structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/          Environment and MongoDB configuration
│   │   ├── controllers/     HTTP request and response coordination
│   │   ├── middleware/      Auth, errors, logging, and request concerns
│   │   ├── models/          Mongoose User and Url schemas
│   │   ├── routes/          Versioned Express route definitions
│   │   ├── services/        URL creation, listing, redirect, and deletion logic
│   │   ├── utils/           JWT, short-code, and error helpers
│   │   ├── validators/      External input validation
│   │   ├── app.js           Express app composition
│   │   └── server.js        HTTP server lifecycle and graceful shutdown
│   ├── test/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             Shared API client
│   │   ├── components/      Reusable UI, forms, guards, charts, and tables
│   │   ├── context/         Authentication session state
│   │   ├── pages/            Home, authentication, and dashboard screens
│   │   ├── App.jsx          Route definitions
│   │   └── styles.css       Global theme and loading animation
│   ├── .env.example
│   └── package.json
├── DEPLOYMENT.md            Render and Vercel deployment instructions
├── render.yaml              Render Blueprint configuration
├── vercel.json               Root Vercel configuration
└── test-rate-limit.cjs      Rate-limit smoke-test script
```

## Local setup

### Prerequisites

- Node.js 20 or newer
- npm
- MongoDB Atlas account or a local MongoDB instance
- Git

### 1. Clone the repository

```bash
git clone https://github.com/ghulammuttaqashah/minilink.git
cd minilink
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Set values in `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/
MONGODB_DB_NAME=url_shortener
PUBLIC_BASE_URL=http://localhost:5000
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=use-a-long-local-development-secret
```

Never commit `.env` files or real credentials.

Install and start the backend:

```bash
npm install
npm run dev
```

The backend runs at `http://localhost:5000`.

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
cp .env.example .env
```

Set:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Install and start Vite:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### 4. Verify the backend

```bash
curl http://localhost:5000/health
```

Expected:

```json
{"data":{"status":"ok"}}
```

## Useful commands

Backend:

```bash
cd backend
npm test
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

Rate-limit smoke test from the repository root:

```bash
node test-rate-limit.cjs
```

For a local backend:

```bash
API_BASE_URL=http://localhost:5000 node test-rate-limit.cjs
```

The authentication limiter allows 20 requests per 15 minutes. The test uses
invalid credentials, so HTTP 401 is expected before HTTP 429. The current limiter
is process-local and should be moved to Redis before running multiple instances.

## API summary

### Authentication

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

### URLs

```text
POST   /api/v1/urls
GET    /api/v1/urls/mine
DELETE /api/v1/urls/:id
GET    /api/v1/urls/:shortCode
GET    /:shortCode
GET    /health
```

Create request example:

```json
{
  "originalUrl": "https://example.com/product",
  "customerName": "Acme campaign",
  "customCode": "acme-product"
}
```

Authenticated requests use:

```text
Authorization: Bearer <jwt>
```

## System-design lessons

### Stateless authentication

JWT access tokens allow backend instances to validate sessions without storing
session state in process memory. This supports horizontal scaling, although token
revocation and refresh-token rotation would be needed for a larger production
system.

### Ownership and privacy

Signed-in links use `ownerId` to enforce dashboard ownership. Anonymous links use
a random ownership token; the backend stores only a keyed hash. Creator IP data is
also stored as a keyed hash for audit correlation instead of retaining the raw IP.

### Rate limiting

The API has separate process-local windows:

- General URL APIs: 300 requests per 15 minutes.
- Authentication APIs: 20 requests per 15 minutes.

The current implementation is appropriate for one backend instance. A Redis-backed
limiter is the next step for consistent limits across multiple instances.

### Click analytics

Redirects increment the total click count and append a timestamp to a bounded
90-entry history. The dashboard aggregates timestamps into a seven-day graph.
This is intentionally simple and synchronous. A queue such as BullMQ would be
better for high-volume analytics, retries, and independent processing.

### Production readiness

The backend validates required environment variables, uses Helmet, restricts CORS,
limits JSON payload size, handles graceful shutdown, exposes `/health`, and has
Render/Vercel configuration. See [DEPLOYMENT.md](./DEPLOYMENT.md).

## Roadmap status

Completed for this milestone:

- Basic MERN URL shortener
- Modular backend structure
- MongoDB persistence
- Authentication and ownership
- Dashboard search, filters, sorting, analytics, and deletion
- Rate limiting
- Render and Vercel deployment setup

Deferred for the next iteration:

- Redis cache-aside caching
- Redis-backed distributed rate limiting
- BullMQ asynchronous analytics
- Multiple backend instances and Nginx load balancing
- k6 load testing and measured performance reports
- Rich device, country, referrer, and time-series analytics
