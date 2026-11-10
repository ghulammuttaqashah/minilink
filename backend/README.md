# URL Shortener Backend

This is the Stage 1 backend for the scalable URL shortener project.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `MONGODB_URI` to a local MongoDB instance or a MongoDB Atlas connection string.
For Atlas, copy `.env.example` to `.env`, replace `<username>` and `<password>`,
and keep the database name as `MONGODB_DB_NAME=url_shortener`. The `.env` file is
ignored by Git and must never be committed.

The backend requires a valid `MONGODB_URI` in development; it does not fall back
to a local MongoDB server. If startup reports `bad auth: authentication failed`,
reset the database user's password in MongoDB Atlas and update the local `.env`.
Also verify that the Atlas Network Access list allows your current IP address.

Set `JWT_SECRET` to a long random value for authenticated features:

```env
JWT_SECRET=replace-with-a-long-random-secret
```

## Scripts

```bash
npm run dev
npm start
npm test
```

## API

### Health

```text
GET /health
```

### Create a short URL

```text
POST /api/v1/urls
Content-Type: application/json
```

```json
{
  "originalUrl": "https://example.com",
  "customerName": "Acme launch",
  "customCode": "acme-launch"
}
```

`customerName` is optional and can identify a customer or campaign. `customCode`
must be 3-32 characters using letters, numbers, hyphens, or underscores and is
globally unique. Authenticated URLs are related to the creating user through
`ownerId`. Anonymous creations receive a random ownership token in the response;
the frontend stores and sends it for future anonymous requests. The database
stores hashes of the ownership token and creator IP for audit correlation rather
than retaining the raw IP address.

### Read URL metadata

```text
GET /api/v1/urls/:shortCode
```

### Redirect

```text
GET /:shortCode
```

The redirect currently increments `clickCount` synchronously. This will move to
asynchronous analytics in Stage 5.

## User management and dashboard APIs

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
GET  /api/v1/urls/mine
```

Registration and login return a JWT. Send it on protected requests:

```text
Authorization: Bearer <token>
```

Authenticated URL creations are assigned to the current user. The dashboard lists
those URLs and their current synchronous click counts. Public URL shortening remains
available without an account and is associated with its anonymous ownership token.
