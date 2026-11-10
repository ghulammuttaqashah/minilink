# Scalable URL Shortener Implementation Plan

This document is the working roadmap for the URL shortener project. It is intended to be
updated as each milestone is implemented, tested, measured, and committed.

The project is intentionally built in stages. We start with a correct modular monolith,
then introduce indexes, caching, horizontal scaling, asynchronous processing, and deployment.
Infrastructure must be introduced because a measured problem requires it, not merely to add
complexity.

## Project goals

- Build a functional URL shortener using the MERN stack.
- Learn practical backend and system-design concepts through incremental implementation.
- Keep the backend maintainable and deployable after every major stage.
- Establish performance baselines before making optimizations.
- Measure the effect of MongoDB indexes, Redis caching, multiple instances, and queues.
- Finish with a deployed application and professional documentation.

## Technology stack

| Area | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Cache and queue backend | Redis |
| Queue | BullMQ |
| Local load balancer | Nginx |
| API testing | Postman |
| Load testing | k6 |
| Backend deployment | Render |
| Frontend deployment | Vercel |
| Version control | Git and GitHub |
| Coding assistance | GitHub Copilot |

Prefer free-tier services and open-source tools. Verify current provider limits before
deployment because free-tier behavior can change.

## Current repository state

At the beginning of this plan:

- The backend package exists at `backend/package.json`.
- The backend currently uses CommonJS (`"type": "commonjs"`).
- No application source files or test files have been created yet.
- The backend package has only a placeholder test script.

Unless there is a reason to migrate later, keep CommonJS for the initial implementation.
Do not mix CommonJS and ESM modules.

## Development rules

1. Do not generate the entire application at once.
2. Complete and verify one milestone before starting the next.
3. Explain the purpose of important files before implementing them.
4. Use readable JavaScript and consistent naming.
5. Follow REST API conventions and stable error formats.
6. Validate all external input.
7. Keep secrets in environment variables.
8. Avoid unnecessary dependencies and abstractions.
9. Keep the application stateless where possible.
10. Measure performance rather than inventing or assuming results.
11. Add a meaningful Git commit at each completed milestone.
12. Document important design decisions when they are made.

---

# Architecture evolution

## Stage 1: Single backend

```text
React frontend
      |
      v
Express backend
      |
      v
MongoDB Atlas
```

One backend process handles URL creation, redirects, validation, and error handling.
MongoDB is the source of truth. Click counting may initially be synchronous.

## Stage 2: Indexed MongoDB

```text
React frontend
      |
      v
Express backend --> URL service --> MongoDB Atlas
                                  (unique and query-specific indexes)
```

Access patterns are documented, important queries are indexed, and `explain()` is used
to measure query plans.

## Stage 3: Redis cache-aside

```text
React frontend
      |
      v
Express backend --> Redis cache
                       | hit
                       v
                 redirect response
                       |
                     miss
                       v
                  MongoDB Atlas
                       |
                       v
                 populate Redis
```

Redis is a performance layer. MongoDB remains the source of truth.

## Stage 4: Horizontal scaling

```text
React frontend
      |
      v
Nginx load balancer
      |         |         |
      v         v         v
API instance  API instance  API instance
      |         |         |
      +---------+---------+
          shared Redis
          shared MongoDB
```

All API instances must be stateless. Shared state belongs in MongoDB or Redis.

## Stage 5: Queues and workers

```text
API instances --> BullMQ analytics queue --> analytics worker --> MongoDB
       |
       +--> Redis cache
       +--> MongoDB
```

Redirects return without waiting for analytics persistence. The worker handles retries,
failures, and idempotent event processing.

## Stage 6: Deployed architecture

```text
User browser
     |
     v
Vercel React application
     |
     v
Render backend service
     |
     +--> stateless API processes
     +--> managed Redis
     +--> MongoDB Atlas
     +--> BullMQ queue --> worker process
     +--> structured logs and metrics
```

The exact number of processes and separate worker services depends on the selected
hosting plan. If the free tier cannot run a separate worker, run it locally for learning
and document the deployment limitation.

---

# Backend architecture

## Planned backend structure

```text
backend/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── env.js
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── logger.js
│   ├── routes/
│   │   ├── health.routes.js
│   │   ├── url.routes.js
│   │   └── analytics.routes.js
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── url.controller.js
│   │   └── analytics.controller.js
│   ├── services/
│   │   ├── url.service.js
│   │   ├── redirect.service.js
│   │   ├── cache.service.js
│   │   ├── rate-limit.service.js
│   │   └── analytics.service.js
│   ├── models/
│   │   ├── url.model.js
│   │   └── click-event.model.js
│   ├── middleware/
│   │   ├── error.middleware.js
│   │   ├── not-found.middleware.js
│   │   ├── request-id.middleware.js
│   │   ├── request-logger.middleware.js
│   │   ├── rate-limit.middleware.js
│   │   └── validation.middleware.js
│   ├── validators/
│   │   ├── url.validator.js
│   │   └── pagination.validator.js
│   ├── queues/
│   │   ├── analytics.queue.js
│   │   └── queue-events.js
│   ├── workers/
│   │   └── analytics.worker.js
│   ├── metrics/
│   │   ├── counters.js
│   │   └── metrics.middleware.js
│   └── utils/
│       ├── errors.js
│       ├── response.js
│       └── short-code.js
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── setup.js
├── scripts/
│   ├── seed-database.js
│   └── clear-database.js
├── k6/
│   ├── redirect.js
│   ├── create-url.js
│   └── mixed-traffic.js
├── nginx/
│   └── nginx.conf
├── .env.example
├── package.json
└── README.md
```

## Folder responsibilities

- `app.js`: creates and configures Express; does not start the listener.
- `server.js`: starts the server, dependencies, workers, and shutdown lifecycle.
- `config/`: validates environment variables and creates infrastructure clients.
- `routes/`: maps HTTP paths to controllers.
- `controllers/`: translates HTTP requests and service results; keep controllers thin.
- `services/`: owns business rules and orchestration between MongoDB, Redis, and queues.
- `models/`: defines Mongoose schemas and database models.
- `middleware/`: cross-cutting HTTP behavior such as validation, logging, errors, and limits.
- `validators/`: defines request and query validation rules.
- `queues/`: creates queues and publishes jobs.
- `workers/`: consumes and processes asynchronous jobs.
- `metrics/`: records application and infrastructure measurements.
- `utils/`: small reusable helpers, not a dumping ground for business logic.
- `tests/`: separates unit tests, integration tests, and fixtures.
- `scripts/`: repeatable development and database utilities.
- `k6/`: load-testing scenarios.
- `nginx/`: local reverse-proxy and load-balancer configuration.

## Request flow

```text
HTTP request
  -> Express app
  -> request ID, logging, validation, and rate-limit middleware
  -> route
  -> controller
  -> service
  -> Redis, MongoDB, or queue
  -> controller response
  -> centralized error middleware when needed
```

---

# API contract

All versioned APIs use the `/api/v1` prefix. The redirect route remains short and
user-facing.

## Health

```text
GET /health/live
```

Confirms that the process is running.

```text
GET /health/ready
```

Confirms that required dependencies are available according to the chosen readiness
policy.

## URL APIs

```text
POST /api/v1/urls
```

Creates a short URL.

Request:

```json
{
  "originalUrl": "https://example.com/articles/system-design"
}
```

Response shape:

```json
{
  "data": {
    "shortCode": "Ab12xY",
    "shortUrl": "https://short.example/Ab12xY",
    "originalUrl": "https://example.com/articles/system-design",
    "createdAt": "2026-11-10T12:00:00.000Z"
  }
}
```

```text
GET /:shortCode
```

Redirects to the original URL.

```text
GET /api/v1/urls/:shortCode
```

Returns URL metadata without redirecting.

```text
GET /api/v1/urls?page=1&limit=20
```

Lists URLs with bounded pagination. Later query parameters may include `sort`,
`createdAfter`, and `createdBefore`.

```text
GET /api/v1/urls/:shortCode/stats
```

Returns aggregate click statistics.

```text
GET /api/v1/urls/:shortCode/analytics
```

Returns time-based analytics after asynchronous processing is implemented.

## Future APIs

Only add these when ownership or multi-user behavior is actually required:

```text
PATCH  /api/v1/urls/:shortCode
DELETE /api/v1/urls/:shortCode
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/users/me/urls
```

## Error contract

Use one predictable error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A valid URL is required",
    "details": []
  }
}
```

Important status codes:

- `201`: URL created.
- `200`: Successful read or redirect-related metadata response.
- `400`: Invalid request.
- `404`: Resource or short code not found.
- `409`: Uniqueness or conflict error.
- `429`: Rate limit exceeded.
- `500`: Unexpected server failure.
- `503`: Dependency or readiness failure.

---

# Dependency plan

Do not install every dependency on day one. Add dependencies when their stage begins.

## Runtime dependencies

| Dependency | Purpose | Stage |
|---|---|---|
| `express` | HTTP server and routing | 1 |
| `mongoose` | MongoDB schemas and models | 1 |
| `dotenv` | Local environment loading | 1 |
| `zod` | Runtime request and environment validation | 1 |
| `nanoid` | Short-code generation | 1 |
| `cors` | Cross-origin request handling | 1 |
| `helmet` | Security-related HTTP headers | 1 |
| `pino` | Structured logging | 1 or 5 |
| `pino-http` | HTTP request logging | 1 or 5 |
| `ioredis` | Redis client | 3 |
| `bullmq` | Redis-backed background queues | 5 |
| `express-rate-limit` | Rate-limit middleware | 5 |
| `rate-limit-redis` | Distributed rate-limit storage | 5 |
| `compression` | Optional response compression | 6 |

## Development dependencies

| Dependency | Purpose | Stage |
|---|---|---|
| `nodemon` | Restart development server | 1 |
| `vitest` | Unit and integration test runner | 1 |
| `supertest` | HTTP endpoint testing | 1 |
| `eslint` | Static analysis | 1 |
| `prettier` | Formatting | 1 |
| `mongodb-memory-server` | Optional isolated MongoDB tests | 2 |

Native `fetch` is preferred over Axios unless the project later needs Axios-specific
features.

## External tools

- MongoDB Atlas: hosted MongoDB.
- Redis: local Redis first, then a compatible hosted service.
- Nginx: local reverse proxy and load balancer.
- Postman: manual API testing.
- k6: load testing.
- Render: backend deployment.
- Vercel: frontend deployment.
- GitHub: source control and README hosting.

---

# Stage 1: Basic MERN application

## Objective

Build a correct URL shortener with a clean modular-monolith backend and a minimal React
frontend. The focus is correctness, structure, validation, and error handling rather than
premature optimization.

## Concepts

- REST API design and HTTP status codes.
- Express middleware.
- Controllers, services, and models.
- MongoDB documents and Mongoose schemas.
- Environment-based configuration.
- Input validation.
- Centralized error handling.
- Stateless request processing.
- Frontend-backend integration.

## Prerequisites

- JavaScript, promises, and `async`/`await`.
- HTTP and JSON.
- Basic React.
- Basic MongoDB.
- Git fundamentals.

## Implementation tasks

1. Update backend package scripts.
2. Keep the existing CommonJS module choice consistent.
3. Create the backend folder structure.
4. Add `.env.example` and environment validation.
5. Create `app.js` separately from `server.js`.
6. Add JSON parsing, CORS, security headers, and request logging.
7. Add a health endpoint.
8. Create a MongoDB Atlas database and connection module.
9. Fail startup clearly when required configuration or the database is unavailable.
10. Create the URL model.
11. Generate short codes and handle collisions.
12. Implement URL creation.
13. Implement redirect lookup.
14. Add validation and centralized errors.
15. Create the minimal React form.
16. Add loading, success, and error states.
17. Add unit and integration tests.

## Backend changes

Initial model:

```text
Url
├── _id
├── originalUrl
├── shortCode
├── clickCount
├── createdAt
└── updatedAt
```

Initial APIs:

```text
GET  /health
POST /api/v1/urls
GET  /api/v1/urls/:shortCode
GET  /:shortCode
```

Validate URL format and only allow intended protocols, such as `http` and `https`.

## Frontend changes

- URL submission form.
- Loading state.
- Success state with the generated short URL.
- Validation and API errors.
- Optional copy-to-clipboard behavior.

Do not build authentication or a full analytics dashboard yet.

## Testing

Verify:

- Valid URLs are shortened.
- Invalid URLs are rejected.
- Unsupported protocols are rejected.
- Short-code collisions are handled.
- Existing codes redirect.
- Missing codes return 404.
- Malformed requests produce controlled errors.
- Missing configuration fails clearly.

## Expected outcome

A user can submit a long URL, receive a unique short URL, and redirect through it.
The backend is organized, testable, and configurable through environment variables.

## Suggested commits

```text
chore: initialize backend project
feat: add express application and health check
feat: connect backend to mongodb atlas
feat: add url model and shortening endpoint
feat: add short url redirect flow
feat: add request validation and centralized errors
feat: add basic react url shortening interface
test: cover basic url shortening flow
```

## Documentation

Document local setup, environment variables, start commands, APIs, response formats,
the URL model, and why the backend is a modular monolith.

---

# Stage 2: Database optimization

## Objective

Make database performance intentional by designing indexes from real access patterns,
bounding result sizes, and using MongoDB `explain("executionStats")`.

## Concepts

- Access-pattern-driven schema design.
- Unique indexes.
- Compound indexes.
- Query selectivity.
- Projections and covered queries.
- Page-based and cursor-based pagination.
- Query plans and collection scans.
- Read/write and index-maintenance trade-offs.

## Prerequisites

- Stage 1 redirect and creation flows work.
- Common queries have been listed.
- A seed dataset exists.
- Basic MongoDB query syntax is understood.

## Implementation tasks

1. List all URL access patterns.
2. Add the unique `shortCode` index.
3. Evaluate an index on `createdAt`.
4. Add compound indexes only for demonstrated query patterns.
5. Add bounded pagination.
6. Add projections.
7. Run `explain("executionStats")`.
8. Compare collection scans and indexed queries.
9. Measure documents and keys examined.
10. Document every index and its supported query.

## Backend changes

Add:

```text
GET /api/v1/urls?page=1&limit=20
GET /api/v1/urls/:shortCode/stats
```

Potential indexes:

```text
shortCode: unique
createdAt: descending
ownerId + createdAt: compound, only if users are introduced
```

Do not add speculative indexes.

## Frontend changes

Optional basic URL listing page with pagination, click count, and creation date.
Performance measurement must use direct API and database metrics, not only browser timing.

## Testing

Verify duplicate short codes fail safely, pagination limits are enforced, sorting is
deterministic, projections return only intended fields, and explain plans use expected
indexes.

Record:

- `executionTimeMillis`
- `totalDocsExamined`
- `totalKeysExamined`
- `nReturned`
- Winning plan
- Whether a collection scan occurred

## Expected outcome

Redirect lookups use the right index, listings are bounded, query plans are recorded,
and the cost of each index can be explained.

## Suggested commits

```text
feat: add unique short code index
feat: add paginated url listing
perf: optimize url queries with projections
test: verify pagination and index constraints
docs: document mongodb query plans and indexes
```

---

# Stage 3: Redis caching

## Objective

Reduce repeated database reads for frequently accessed short URLs using the cache-aside
pattern, while keeping MongoDB as the source of truth.

## Concepts

- Cache-aside reads.
- Cache keys and serialization.
- TTL.
- Invalidation.
- Cache consistency.
- Cache stampedes.
- Redis failures.
- Cache metrics.

## Prerequisites

- Stage 2 redirect flow works.
- Redis is available locally.
- Uncached baseline measurements exist.

## Implementation tasks

1. Add local Redis configuration.
2. Implement a Redis connection module.
3. Define a cache key format:

   ```text
   url:short-code:{shortCode}
   ```

4. Read Redis before MongoDB.
5. Read MongoDB on a miss.
6. Cache successful lookups.
7. Add a moderate TTL.
8. Decide whether short-lived negative caching is needed.
9. Do not cache transient database failures.
10. Invalidate or update entries when URL data changes.
11. Track hits, misses, errors, and database fallbacks.
12. Compare cached and uncached results.

## Backend changes

Create a redirect service that coordinates Redis, MongoDB, cache population, and metrics.
Redis failures must have an explicit policy; the initial safe default is to fall back to
MongoDB for redirect reads when possible.

## Frontend changes

No required changes.

## Testing

Verify first lookup is a miss, subsequent lookup is a hit, expired keys fall back to
MongoDB, Redis errors are logged, stale data is invalidated, and hit ratio is calculated.

## Expected outcome

Popular URLs can be served from Redis, Redis behavior is observable, and performance is
compared against the Stage 2 baseline.

## Suggested commits

```text
feat: add redis connection configuration
feat: implement cache aside redirect lookup
feat: add url cache ttl and invalidation
feat: add cache hit and miss metrics
test: cover redis cache hit miss and failure paths
docs: document redis caching strategy
```

---

# Stage 4: Horizontal scaling

## Objective

Run multiple stateless Express instances behind Nginx and prove that any instance can
serve any request.

## Concepts

- Stateless architecture.
- Horizontal scaling.
- Reverse proxies.
- Load-balancing algorithms.
- Shared state.
- Distributed sessions and rate limits.
- Liveness and readiness.
- Instance failure.

## Prerequisites

- No required state is held only in process memory.
- MongoDB and Redis are shared dependencies.
- Health endpoints exist.
- Configuration comes from environment variables.

## Implementation tasks

1. Add an instance identifier to development logs and health output.
2. Run two backend processes on different ports.
3. Verify both connect to MongoDB and Redis.
4. Add Nginx upstream configuration.
5. Test round-robin distribution.
6. Stop one instance and verify continued traffic.
7. Confirm state is shared.
8. Test concurrent requests.
9. Separate liveness and readiness checks.
10. Document scaling behavior.

## Backend changes

Add:

```text
GET /health/live
GET /health/ready
```

Readiness should reflect the chosen MongoDB and Redis dependency policy.

## Frontend changes

No major changes. The frontend calls one public API URL, which points to the load balancer
or deployed backend.

## Testing

Verify requests reach both instances, Redis and MongoDB state is shared, one instance can
stop without losing all traffic, and all-instance failure produces an appropriate error.

## Expected outcome

Multiple backend processes work behind Nginx and no application-critical state is
instance-local.

## Suggested commits

```text
feat: add liveness and readiness health checks
chore: support multiple backend instances
chore: add nginx local load balancer configuration
test: verify requests across multiple instances
docs: document horizontal scaling and shared state
```

---

# Stage 5: Advanced backend concepts

## Objective

Add production-oriented protection and asynchronous behavior without slowing down redirects.

## Concepts

- Rate limiting.
- Distributed counters.
- Message queues.
- At-least-once delivery.
- Idempotency.
- Retries and backoff.
- Dead-letter handling.
- Backpressure.
- Graceful shutdown.
- Structured logs.
- Fault tolerance.

## Prerequisites

- Stateless multi-instance backend.
- Redis connectivity.
- Stable redirect flow.
- Clear URL and click-event data models.

## Implementation tasks

### Rate limiting

1. Define limits per endpoint and client identity.
2. Start with IP-based limits.
3. Store counters in Redis.
4. Share limits across instances.
5. Return HTTP 429 and rate-limit headers.
6. Configure proxy IP behavior correctly.
7. Use separate limits for creation, redirects, and administrative APIs.

### Analytics queue

8. Define the click event:

   ```text
   shortCode
   timestamp
   requestId
   userAgent
   referrer
   processing metadata
   ```

9. Publish click events to BullMQ.
10. Return the redirect without waiting for persistence.
11. Create an analytics worker.
12. Persist or aggregate analytics.
13. Add idempotency.
14. Add bounded retries.
15. Make failed jobs visible.
16. Monitor queue depth and job age.

### Reliability

17. Add request IDs.
18. Add structured JSON logging.
19. Stop accepting requests during shutdown.
20. Allow in-flight requests to finish.
21. Stop workers and close Redis/MongoDB connections.
22. Add dependency timeouts.
23. Define Redis, MongoDB, and queue failure behavior.

## Backend changes

Potential model:

```text
ClickEvent
├── shortCode
├── occurredAt
├── requestId
├── userAgent
├── referrer
└── processing metadata
```

Add:

```text
GET /api/v1/urls/:shortCode/stats
GET /api/v1/urls/:shortCode/analytics
```

These should eventually require authentication in a multi-user product.

## Frontend changes

Add click counts and a basic analytics view only after the backend analytics contract is
stable. The redirect UI must not wait for analytics processing.

## Testing

Verify under-limit and over-limit behavior, shared limits across instances, queue
publishing, worker processing, retries, permanent failures, duplicate delivery, and
graceful shutdown.

## Expected outcome

The system limits abuse, processes analytics asynchronously, exposes failures, retries
temporary errors safely, and shuts down without dropping work unnecessarily.

## Suggested commits

```text
feat: add distributed redis rate limiting
feat: add asynchronous click analytics queue
feat: add analytics worker and retry handling
feat: add structured request logging
feat: add graceful shutdown lifecycle
test: cover rate limiting and analytics processing
docs: document reliability and failure handling
```

---

# Stage 6: Performance testing and deployment

## Objective

Measure the system under repeatable load, compare each optimization, and deploy the
frontend and backend.

## Concepts

- Throughput and concurrency.
- Average latency.
- p95 and p99 tail latency.
- Error rate.
- Capacity and bottlenecks.
- Production configuration.
- Health checks and smoke tests.

## Implementation tasks

1. Create a representative dataset.
2. Define k6 scenarios for creation, redirects, missing codes, analytics, and mixed traffic.
3. Run a no-cache baseline.
4. Record response-time distributions and throughput.
5. Record error rates and query metrics.
6. Run Redis-enabled tests.
7. Test multiple instances.
8. Test rate limiting and queue behavior under load.
9. Change one major variable at a time.
10. Repeat tests after each optimization.
11. Create a performance report.

## k6 metrics

| Metric | Meaning |
|---|---|
| Requests per second | Throughput |
| Average duration | Mean response time |
| p95 duration | 95% of responses completed below this duration |
| p99 duration | Tail latency |
| Error rate | Failed requests divided by total requests |
| VUs | Concurrent virtual users |
| Data sent/received | Network usage |

Also collect when possible:

- MongoDB query counts and execution times.
- Redis hit, miss, and error counts.
- Queue depth, job age, and processing time.
- Node.js CPU and memory.
- Host or container CPU and memory.
- Nginx upstream errors.

## Deployment

### Render backend

1. Configure build and start commands.
2. Add production environment variables.
3. Configure health checks.
4. Allow MongoDB Atlas network access.
5. Configure Redis.
6. Verify logs and graceful shutdown.
7. Run public API smoke tests.

### Vercel frontend

1. Configure the project.
2. Set the production API URL.
3. Configure backend CORS.
4. Deploy.
5. Verify browser requests and redirects.

### Production environment variables

```text
NODE_ENV
PORT
MONGODB_URI
MONGODB_DATABASE
REDIS_URL
PUBLIC_BASE_URL
FRONTEND_ORIGIN
LOG_LEVEL
RATE_LIMIT configuration
```

Never commit actual secret values.

## Expected outcome

The application is deployed, k6 scenarios are repeatable, and performance differences
between database-only, cached, multi-instance, and queued versions are documented.

## Suggested commits

```text
test: add k6 redirect load test
test: add k6 mixed traffic scenario
perf: record baseline performance results
perf: compare redis and database redirect performance
chore: prepare backend for render deployment
chore: prepare frontend for vercel deployment
docs: add production deployment guide
docs: add performance report and architecture decisions
```

---

# System-design learning notes

| Concept | Problem solved | Project location | Benefits | Trade-offs and alternatives | Measurement |
|---|---|---|---|---|---|
| Stateless backend | Any instance can serve a request | All API services | Easy horizontal scaling | Requires shared infrastructure | Per-instance traffic and failover |
| MongoDB indexes | Avoid scanning all documents | URL model | Faster reads | Extra storage and slower writes | `explain()`, docs examined |
| Compound indexes | Optimize filtering and sorting together | Listing queries | Efficient targeted reads | Field ordering matters | Winning query plan |
| Cache-aside | Reduce database reads | Redirect service | Lower latency and DB load | Staleness and invalidation | Hit ratio and DB queries |
| TTL | Remove stale cache entries | Redis | Automatic cleanup | Expiration can cause miss spikes | Expiration and miss rate |
| Rate limiting | Protect capacity and prevent abuse | Middleware and Redis | Shared protection | Can reject legitimate clients | 429 rate and limit usage |
| Queues | Move work off request path | Analytics queue/worker | Faster requests and retries | Eventual consistency | Queue depth and job age |
| Idempotency | Prevent duplicate effects | Analytics worker | Safe at-least-once processing | Requires event identifiers | Duplicate event count |
| Load balancing | Spread traffic | Nginx | Uses multiple processes | Additional routing layer | Per-instance traffic |
| Graceful shutdown | Avoid dropped work | Server and worker lifecycle | Safer deployments | Shutdown takes time | Shutdown duration |
| Structured logging | Debug distributed behavior | Logger middleware | Searchable and correlated logs | Requires discipline | Error and request analysis |
| Pagination | Bound response and query size | URL listing | Predictable resource use | Offset pagination degrades deeply | Latency by page |
| Load testing | Find capacity limits | k6 | Repeatable evidence | Results depend on environment | RPS, p95, p99, errors |

## Basic versus production-oriented behavior

| Area | Basic version | Production-oriented version |
|---|---|---|
| Short codes | Random code and collision check | Database uniqueness, bounded retries, metrics |
| Redirects | MongoDB lookup | Redis cache-aside with fallback |
| Click count | Synchronous update | Asynchronous event processing |
| Rate limiting | In-memory or absent | Redis-backed distributed limits |
| Logging | Console output | Structured logs with request IDs |
| Errors | Generic messages | Stable codes and centralized handling |
| Health | One health route | Separate liveness and readiness |
| Deployment | One process | Multiple stateless instances |
| Analytics | Direct document query | Queue-based aggregation |
| Testing | Manual requests | Unit, integration, failure, and load tests |
| Database | Basic schema | Access-pattern-driven indexes |
| Shutdown | Immediate exit | Drain, stop workers, close connections |

---

# Performance measurement plan

## Baseline rules

Before Redis or horizontal scaling:

1. Seed a known dataset.
2. Record dataset size and environment.
3. Warm up the application.
4. Run each scenario multiple times.
5. Keep concurrency and request mix consistent.
6. Record configuration with every result.
7. Never invent performance numbers.

## Required metrics

- Average API response time.
- p95 latency.
- p99 latency.
- Requests per second.
- Database query count.
- Database execution time.
- Cache hit ratio.
- Queue depth and processing time.
- CPU usage where measurable.
- Memory usage where measurable.
- Error rate.

## Comparison table

Maintain a table like this in the final performance report:

| Version | Scenario | VUs | Duration | RPS | Avg | p95 | p99 | Error rate | DB queries | Cache hit ratio |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Stage 2 | Redirect, no cache | Record | Record | Measure | Measure | Measure | Measure | Measure | Measure | N/A |
| Stage 3 | Redirect, cache enabled | Record | Record | Measure | Measure | Measure | Measure | Measure | Measure | Measure |
| Stage 4 | Redirect, two instances | Record | Record | Measure | Measure | Measure | Measure | Measure | Measure | Measure |
| Stage 5 | Redirect with queue | Record | Record | Measure | Measure | Measure | Measure | Measure | Measure | Measure |

---

# Day-wise plan

This plan assumes approximately two to three focused hours per day. Adjust duration
without skipping validation.

## Week 1: Backend foundation

### Day 1

- Confirm scope and conventions.
- Initialize backend scripts.
- Keep CommonJS consistent.
- Create `.env.example`.
- Commit: `chore: initialize backend project`.

### Day 2

- Create `app.js` and `server.js`.
- Add health endpoint and middleware.
- Add environment validation.
- Commit: `feat: add express application and health check`.

### Day 3

- Create MongoDB Atlas database.
- Implement connection setup and shutdown.
- Test connection failures.
- Commit: `feat: connect backend to mongodb atlas`.

### Day 4

- Design URL schema.
- Implement short-code generation.
- Add creation service and controller.
- Commit: `feat: add url model and shortening endpoint`.

### Day 5

- Implement redirects and 404 behavior.
- Add centralized errors.
- Test with Postman.
- Commit: `feat: add short url redirect flow`.

## Week 2: Frontend and database

### Day 6

- Create React frontend.
- Add form and states.
- Commit: `feat: add basic react url form`.

### Day 7

- Connect frontend to backend.
- Configure CORS and frontend variables.
- Commit: `feat: connect frontend to url api`.

### Day 8

- Add unit and integration testing.
- Test creation and redirect flows.
- Commit: `test: cover basic url shortening flow`.

### Day 9

- List access patterns.
- Add unique short-code index.
- Add database seed script.
- Commit: `feat: add url database indexes`.

### Day 10

- Add pagination.
- Run `explain()`.
- Document query plans.
- Commit: `perf: optimize url queries and pagination`.

## Week 3: Redis and scaling

### Day 11

- Run Redis locally.
- Add Redis configuration and connection tests.
- Commit: `feat: add redis connection configuration`.

### Day 12

- Implement cache-aside redirects and TTL.
- Commit: `feat: implement redirect cache aside flow`.

### Day 13

- Add cache metrics and invalidation.
- Compare cached and uncached behavior.
- Commit: `feat: add cache metrics and invalidation`.

### Day 14

- Run two backend instances.
- Add instance identifiers.
- Verify shared data.
- Commit: `chore: support multiple backend instances`.

### Day 15

- Configure Nginx.
- Test distribution and instance failure.
- Commit: `chore: add nginx load balancer configuration`.

## Week 4: Reliability

### Day 16

- Define rate-limit policies.
- Add distributed Redis rate limiting.
- Commit: `feat: add distributed rate limiting`.

### Day 17

- Define analytics events.
- Add BullMQ queue and publishing.
- Commit: `feat: add analytics event queue`.

### Day 18

- Implement worker, retries, and failed-job visibility.
- Commit: `feat: add analytics worker and retries`.

### Day 19

- Add request IDs and structured logging.
- Commit: `feat: add structured request logging`.

### Day 20

- Implement graceful shutdown.
- Test dependency and worker cleanup.
- Commit: `feat: add graceful shutdown handling`.

## Week 5: Performance and deployment

### Day 21

- Write k6 redirect scenario.
- Establish no-cache baseline.
- Commit: `test: add redirect load test`.

### Day 22

- Add creation and mixed-traffic scenarios.
- Record required metrics.
- Commit: `test: add mixed traffic load scenarios`.

### Day 23

- Compare database-only, cached, and multi-instance behavior.
- Commit: `perf: compare cache and horizontal scaling results`.

### Day 24

- Prepare Render deployment and production variables.
- Commit: `chore: prepare backend deployment`.

### Day 25

- Deploy frontend to Vercel.
- Configure production API URL and CORS.
- Commit: `chore: deploy frontend`.

### Day 26

- Run production smoke tests.
- Review logs and health checks.
- Commit: `test: add production smoke test checklist`.

### Day 27

- Write architecture, API, and performance documentation.
- Add diagrams and design decisions.
- Commit: `docs: document architecture and performance results`.

### Day 28

- Review code and dependencies.
- Verify environment documentation.
- Tag the first complete version.
- Commit: `chore: prepare first production release`.

---

# Progress checklist

## Stage 1: Basic application

- [x] Backend package scripts updated.
- [x] CommonJS convention documented.
- [x] Environment validation added.
- [x] Express application created.
- [x] Health endpoint created.
- [ ] MongoDB Atlas connected with local credentials.
- [x] URL schema created.
- [x] Short-code generation implemented.
- [x] URL creation endpoint implemented.
- [x] Redirect endpoint implemented.
- [x] Validation added.
- [x] Centralized error handling added.
- [x] React frontend created.
- [x] Frontend connected to backend.
- [ ] Postman collection created.
- [x] Basic tests added.

## Stage 2: Database optimization

- [ ] Access patterns documented.
- [ ] Unique short-code index added.
- [ ] Creation-date index evaluated.
- [ ] Compound indexes evaluated.
- [ ] Pagination implemented.
- [ ] Projections used where appropriate.
- [ ] Explain plans recorded.
- [ ] Query bottlenecks documented.
- [ ] Seed script created.

## Stage 3: Redis caching

- [ ] Redis configured locally.
- [ ] Redis connection module created.
- [ ] Cache key format documented.
- [ ] Cache-aside redirect flow implemented.
- [ ] TTL configured.
- [ ] Cache invalidation implemented.
- [ ] Cache hit/miss metrics added.
- [ ] Redis failure behavior tested.
- [ ] Cache performance compared with baseline.

## Stage 4: Horizontal scaling

- [ ] Backend is stateless.
- [ ] Multiple backend processes run locally.
- [ ] Instance identifier added.
- [ ] Nginx configured.
- [ ] Load distribution verified.
- [ ] Shared Redis verified.
- [ ] Shared MongoDB verified.
- [ ] Instance failure tested.
- [ ] Liveness and readiness checks separated.

## Stage 5: Advanced backend

- [ ] Rate-limit policy documented.
- [ ] Distributed rate limiting added.
- [ ] 429 responses tested.
- [ ] Analytics event format defined.
- [ ] BullMQ queue added.
- [ ] Worker process added.
- [ ] Retry policy added.
- [ ] Failed-job handling added.
- [ ] Idempotency strategy implemented.
- [ ] Request IDs added.
- [ ] Structured logging added.
- [ ] Graceful shutdown added.

## Stage 6: Testing and deployment

- [ ] k6 redirect test created.
- [ ] k6 URL creation test created.
- [ ] k6 mixed-traffic test created.
- [ ] Baseline measured.
- [ ] Cache comparison measured.
- [ ] Multi-instance comparison measured.
- [ ] p95 and p99 recorded.
- [ ] RPS recorded.
- [ ] Error rate recorded.
- [ ] Database query metrics recorded.
- [ ] Cache hit ratio recorded.
- [ ] Backend deployed to Render.
- [ ] Frontend deployed to Vercel.
- [ ] Production environment variables configured.
- [ ] Production smoke tests passed.
- [ ] README completed.
- [ ] Architecture diagrams added.
- [ ] Performance report added.
- [ ] Design decisions documented.

---

# Final README requirements

The final project README should include:

1. Project overview.
2. Features.
3. Technology stack.
4. Local setup.
5. Environment variables.
6. Backend structure.
7. API documentation.
8. Postman instructions.
9. Architecture diagrams.
10. MongoDB index decisions.
11. Redis caching strategy.
12. Horizontal scaling explanation.
13. Queue and worker behavior.
14. Rate-limit policy.
15. Failure-handling strategy.
16. k6 instructions.
17. Performance comparison tables.
18. Deployment instructions.
19. Known limitations.
20. Future improvements.

## Possible future improvements

Keep these outside the initial implementation unless they become necessary:

- User authentication.
- Custom aliases.
- URL expiration.
- Advanced analytics dashboards.
- Abuse detection.
- QR-code generation.
- CDN integration.
- Multi-region deployment.
- Kafka or RabbitMQ comparison.
- Distributed tracing.
- Kubernetes deployment.

The first important milestone is a correct, testable, well-structured backend. Redis,
load balancing, and queues should improve demonstrated limitations rather than be added
only for complexity.
