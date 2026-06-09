import { describe, expect, it } from "vitest";
import { expiresAt, isExpired } from "../src/retention";

describe("24-hour retention", () => {
  const receivedAt = new Date("2026-06-08T12:00:00.000Z");

  it("sets expiration exactly 24 hours after receipt", () => {
    expect(expiresAt(receivedAt).toISOString()).toBe("2026-06-09T12:00:00.000Z");
  });

  it("keeps messages younger than 24 hours", () => {
    expect(isExpired(receivedAt, new Date("2026-06-09T11:59:59.999Z"))).toBe(false);
  });

  it("expires messages at 24 hours", () => {
    expect(isExpired(receivedAt, new Date("2026-06-09T12:00:00.000Z"))).toBe(true);
  });
});
