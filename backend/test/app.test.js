process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");

test("GET /health returns an ok status", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { data: { status: "ok" } });
});

test("POST /api/v1/urls rejects a missing URL", async () => {
  const response = await request(app).post("/api/v1/urls").send({});

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
});

test("POST /api/v1/urls rejects unsupported protocols", async () => {
  const response = await request(app)
    .post("/api/v1/urls")
    .send({ originalUrl: "javascript:alert(1)" });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
});

test("unknown routes return a structured 404", async () => {
  const response = await request(app).get("/missing-route/extra");

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error.code, "ROUTE_NOT_FOUND");
});
