import { describe, expect, it } from "vitest";
import { expiresAt, isExpired, retentionHours } from "../src/retention";

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

  it("supports a configured minimum retention period", () => {
    expect(expiresAt(receivedAt, 48).toISOString()).toBe("2026-06-10T12:00:00.000Z");
    expect(isExpired(receivedAt, new Date("2026-06-10T11:59:59.999Z"), 48)).toBe(false);
  });

  it("defaults invalid retention values to 24 hours", () => {
    expect(retentionHours(undefined)).toBe(24);
    expect(retentionHours("")).toBe(24);
    expect(retentionHours("0")).toBe(24);
    expect(retentionHours("not-a-number")).toBe(24);
  });

  it("parses a configured retention value", () => {
    expect(retentionHours("48")).toBe(48);
  });
});
