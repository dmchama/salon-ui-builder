import { describe, expect, it } from "vitest";
import { isPreviewableImage, RECEIPT_MAX_BYTES, validateReceiptFile } from "./receipt-file";

const file = (name: string, type: string, size = 1000) =>
  new File([new Uint8Array(size)], name, { type });

describe("validateReceiptFile (spec 002 AC6)", () => {
  it.each([
    ["r.jpg", "image/jpeg"],
    ["r.png", "image/png"],
    ["r.webp", "image/webp"],
    ["r.heic", "image/heic"],
    ["r.pdf", "application/pdf"],
  ])("accepts %s", (name, type) => {
    expect(validateReceiptFile(file(name, type))).toBeNull();
  });

  it("accepts HEIC by extension when the browser gives no MIME type", () => {
    expect(validateReceiptFile(file("IMG_0001.HEIC", ""))).toBeNull();
  });

  it("rejects other types", () => {
    expect(validateReceiptFile(file("r.gif", "image/gif"))).toMatch(/JPG, PNG/);
    expect(validateReceiptFile(file("r.txt", "text/plain"))).toMatch(/JPG, PNG/);
  });

  it("rejects files over 5 MB and empty files", () => {
    expect(validateReceiptFile(file("r.png", "image/png", RECEIPT_MAX_BYTES))).toBeNull();
    expect(validateReceiptFile(file("r.png", "image/png", RECEIPT_MAX_BYTES + 1))).toMatch(/5 MB/);
    expect(validateReceiptFile(file("r.png", "image/png", 0))).toMatch(/empty/);
  });
});

describe("isPreviewableImage", () => {
  it("previews browser images only", () => {
    expect(isPreviewableImage(file("r.png", "image/png"))).toBe(true);
    expect(isPreviewableImage(file("r.heic", "image/heic"))).toBe(false);
    expect(isPreviewableImage(file("r.pdf", "application/pdf"))).toBe(false);
  });
});
