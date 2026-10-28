import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./http";

const respond = (status: number, body: string, statusText = "") =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(body, { status, statusText }));

afterEach(() => vi.restoreAllMocks());

describe("apiRequest error handling", () => {
  it("turns a proxy's HTML 413 page into an ApiError instead of a JSON parse crash", async () => {
    respond(413, "<html><head><title>413 Request Entity Too Large</title></head></html>");
    const err = (await apiRequest("/auth/register", { method: "POST", skipAuth: true }).catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(413);
    expect(err.message).toBe("The file is too large to upload.");
  });

  it("keeps the API's JSON error code and message", async () => {
    respond(400, JSON.stringify({ statusCode: 400, code: "INVALID_RECEIPT_FILE", message: "Receipt must be at most 5 MB" }));
    const err = await apiRequest("/auth/register", { method: "POST", skipAuth: true }).catch((e) => e);
    expect(err).toMatchObject({ statusCode: 400, code: "INVALID_RECEIPT_FILE", message: "Receipt must be at most 5 MB" });
  });

  it("reports a non-JSON success body as an ApiError", async () => {
    respond(200, "<html>oops</html>");
    await expect(apiRequest("/website-settings", { skipAuth: true })).rejects.toBeInstanceOf(ApiError);
  });
});
