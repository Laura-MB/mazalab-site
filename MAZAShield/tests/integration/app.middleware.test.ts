import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp, normaliseCorrelationId } from "../../src/app.js";

/**
 * Focused tests for the cross-cutting concerns added to `createApp()`:
 *   - per-request correlation-id binding
 *   - structured error handling
 *
 * These tests treat the app as a black box and only assert on
 * observable HTTP behaviour, so they are robust to internal logger
 * formatting choices.
 */

describe("app cross-cutting middleware", () => {
  describe("correlation-id middleware", () => {
    it("echoes a well-formed client-supplied x-correlation-id header", async () => {
      const app = createApp();
      const res = await request(app).get("/__definitely-not-a-route__").set("x-correlation-id", "client-abc-123");
      // Route does not exist (404) — but the header must still round-trip.
      expect(res.status).toBe(404);
      expect(res.headers["x-correlation-id"]).toBe("client-abc-123");
    });

    it("generates a UUID when no correlation header is supplied", async () => {
      const app = createApp();
      const res = await request(app).get("/__definitely-not-a-route__");
      expect(res.status).toBe(404);
      const cid = res.headers["x-correlation-id"];
      expect(typeof cid).toBe("string");
      expect(cid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it("rejects a malformed x-correlation-id and substitutes a UUID instead", async () => {
      const app = createApp();
      // Spaces, semicolons and angle brackets are all transport-legal but
      // outside our allowed-character pattern.
      const malformed = "bad value;with <special> chars";
      const res = await request(app)
        .get("/__definitely-not-a-route__")
        .set("x-correlation-id", malformed);
      expect(res.status).toBe(404);
      expect(res.headers["x-correlation-id"]).not.toBe(malformed);
      expect(res.headers["x-correlation-id"]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it("rejects pathologically long correlation ids (defence in depth)", async () => {
      const app = createApp();
      const longId = "x".repeat(500);
      const res = await request(app).get("/__nope__").set("x-correlation-id", longId);
      expect(res.headers["x-correlation-id"]).not.toBe(longId);
    });

    it("CORS headers continue to be emitted (regression check)", async () => {
      const app = createApp();
      const res = await request(app).options("/__nope__");
      // OPTIONS is handled by the CORS preflight middleware.
      expect(res.status).toBe(204);
      expect(res.headers["access-control-allow-origin"]).toBe("*");
      expect(res.headers["access-control-allow-headers"]).toContain("x-correlation-id");
    });
  });

  describe("normaliseCorrelationId helper", () => {
    it("returns the trimmed value when the input is a well-formed string", () => {
      const out = normaliseCorrelationId("  ok-123  ");
      expect(out).toBe("ok-123");
    });

    it("returns a fresh UUID for non-string inputs", () => {
      const out = normaliseCorrelationId(undefined);
      expect(out).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it("returns a fresh UUID for empty / blank inputs", () => {
      expect(normaliseCorrelationId("")).toMatch(/^[0-9a-f-]{36}$/i);
      expect(normaliseCorrelationId("   ")).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it("returns a fresh UUID for inputs containing forbidden characters", () => {
      // The helper itself accepts any string  the regex is what filters
      // it. We exercise transport-legal hostile values here; the
      // newline-injection case lives in dedicated unit coverage.
      expect(normaliseCorrelationId("x x")).toMatch(/^[0-9a-f-]{36}$/i);
      expect(normaliseCorrelationId("x;y")).toMatch(/^[0-9a-f-]{36}$/i);
      expect(normaliseCorrelationId("x<y>")).toMatch(/^[0-9a-f-]{36}$/i);
      // Embedded (not edge) newline survives `.trim()` and must be rejected.
      expect(normaliseCorrelationId("bad\nval")).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it("produces distinct UUIDs across calls", () => {
      const a = normaliseCorrelationId(undefined);
      const b = normaliseCorrelationId(undefined);
      expect(a).not.toBe(b);
    });
  });
});
