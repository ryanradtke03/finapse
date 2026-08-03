import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { bodyHashMatches, routeWebhook } from "../plaid.webhook";

describe("routeWebhook", () => {
  it("syncs on TRANSACTIONS/SYNC_UPDATES_AVAILABLE", () => {
    expect(routeWebhook("TRANSACTIONS", "SYNC_UPDATES_AVAILABLE")).toBe("sync");
  });

  it("flags reauth on ITEM/ITEM_LOGIN_REQUIRED", () => {
    expect(routeWebhook("ITEM", "ITEM_LOGIN_REQUIRED")).toBe("reauth");
  });

  it("ignores unrelated transaction codes", () => {
    expect(routeWebhook("TRANSACTIONS", "INITIAL_UPDATE")).toBe("ignore");
    expect(routeWebhook("TRANSACTIONS", "DEFAULT_UPDATE")).toBe("ignore");
  });

  it("ignores other item codes and unknown types", () => {
    expect(routeWebhook("ITEM", "PENDING_EXPIRATION")).toBe("ignore");
    expect(routeWebhook("ITEM", "WEBHOOK_UPDATE_ACKNOWLEDGED")).toBe("ignore");
    expect(routeWebhook("AUTH", "SMS_MICRODEPOSITS_VERIFICATION")).toBe("ignore");
  });

  it("does not cross type/code boundaries", () => {
    // right code, wrong type — must not sync
    expect(routeWebhook("ITEM", "SYNC_UPDATES_AVAILABLE")).toBe("ignore");
    expect(routeWebhook("TRANSACTIONS", "ITEM_LOGIN_REQUIRED")).toBe("ignore");
  });
});

describe("bodyHashMatches", () => {
  const body = Buffer.from(JSON.stringify({ webhook_type: "TRANSACTIONS" }));
  const hash = crypto.createHash("sha256").update(body).digest("hex");

  it("accepts the matching body hash", () => {
    expect(bodyHashMatches(body, hash)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const tampered = Buffer.from(JSON.stringify({ webhook_type: "AUTH" }));
    expect(bodyHashMatches(tampered, hash)).toBe(false);
  });

  it("rejects a malformed / wrong-length hash without throwing", () => {
    expect(bodyHashMatches(body, "not-hex")).toBe(false);
    expect(bodyHashMatches(body, "abcd")).toBe(false);
    expect(bodyHashMatches(body, "")).toBe(false);
  });
});
