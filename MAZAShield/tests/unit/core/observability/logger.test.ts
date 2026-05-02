import { describe, expect, it } from "vitest";

import { createLogger, withCorrelationId } from "../../../../src/core/observability/logger.js";

describe("logger", () => {
  it("createLogger returns a winston instance with the configured service name", () => {
    const log = createLogger("unit-test-svc");
    expect(log).toBeDefined();
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
    expect(typeof log.child).toBe("function");
    expect(log.defaultMeta).toMatchObject({ service: "unit-test-svc" });
  });

  it("withCorrelationId returns a distinct child logger that can emit", () => {
    const log = createLogger("unit-test-svc");
    const child = withCorrelationId("abc-123", log);
    expect(child).toBeDefined();
    expect(child).not.toBe(log);
    expect(typeof child.info).toBe("function");
    expect(() => child.info("hello from child")).not.toThrow();
  });

  it("withCorrelationId is a no-op when correlation id is empty", () => {
    const log = createLogger("unit-test-svc");
    expect(withCorrelationId("", log)).toBe(log);
    expect(withCorrelationId(undefined, log)).toBe(log);
    expect(withCorrelationId(null, log)).toBe(log);
  });

  it("does not throw when emitting messages with metadata", () => {
    const log = createLogger("unit-test-svc");
    expect(() => log.info("hello", { foo: "bar" })).not.toThrow();
    expect(() => log.warn("warning", { count: 1 })).not.toThrow();
    expect(() => log.error("err", { error: "boom" })).not.toThrow();
  });
});
