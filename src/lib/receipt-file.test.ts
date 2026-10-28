import { describe, expect, it } from "vitest";
import {
  COMPRESSION_ATTEMPTS,
  formatBytes,
  isPreviewableImage,
  planReceipt,
  RECEIPT_MAX_SOURCE_BYTES,
  RECEIPT_UPLOAD_LIMIT_BYTES,
} from "./receipt-file";

const file = (name: string, type: string, size = 1000) => new File([new Uint8Array(size)], name, { type });
const KB = 1024;

describe("planReceipt (spec 003)", () => {
  it("uses a 900 KB upload limit (BR1)", () => {
    expect(RECEIPT_UPLOAD_LIMIT_BYTES).toBe(900 * KB);
  });

  it.each([
    ["r.jpg", "image/jpeg"],
    ["r.png", "image/png"],
    ["r.webp", "image/webp"],
    ["r.pdf", "application/pdf"],
    ["r.heic", "image/heic"],
  ])("accepts %s at or under the limit unchanged (AC4, AC9)", (name, type) => {
    expect(planReceipt(file(name, type, RECEIPT_UPLOAD_LIMIT_BYTES))).toEqual({ action: "accept" });
  });

  it.each([
    ["r.jpg", "image/jpeg"],
    ["r.png", "image/png"],
    ["r.webp", "image/webp"],
  ])("compresses %s over the limit (AC1)", (name, type) => {
    expect(planReceipt(file(name, type, RECEIPT_UPLOAD_LIMIT_BYTES + 1)).action).toBe("compress");
  });

  it("rejects a PDF over the limit with the photo/screenshot message (AC7)", () => {
    expect(planReceipt(file("r.pdf", "application/pdf", 1_650_000))).toEqual({
      action: "reject",
      message: "This PDF is larger than 900 KB. Please upload a photo or screenshot of the receipt instead.",
    });
  });

  it("tries to convert a HEIC over the limit, with a fallback message if the browser can't read it (AC8)", () => {
    const plan = planReceipt(file("IMG_1.HEIC", "", 2_000_000));
    expect(plan.action).toBe("compress");
    expect(plan.action === "compress" && plan.unreadableMessage).toMatch(/JPG photo or a screenshot/);
  });

  it("converts HEIC even under the limit when HEIC is not allowed (SMS campaigns)", () => {
    expect(planReceipt(file("r.heic", "image/heic", 100 * KB), { allowHeic: false }).action).toBe("compress");
  });

  it("rejects anything over 20 MB before processing (BR4)", () => {
    expect(planReceipt(file("r.jpg", "image/jpeg", RECEIPT_MAX_SOURCE_BYTES + 1))).toMatchObject({
      action: "reject",
      message: expect.stringMatching(/20 MB/),
    });
  });

  it("rejects other types and empty files", () => {
    expect(planReceipt(file("r.gif", "image/gif"))).toMatchObject({ action: "reject", message: expect.stringMatching(/JPG, PNG/) });
    expect(planReceipt(file("r.png", "image/png", 0))).toMatchObject({ action: "reject", message: expect.stringMatching(/empty/) });
  });
});

describe("COMPRESSION_ATTEMPTS (BR2)", () => {
  it("starts at 2000 px / 0.8 and only gets smaller", () => {
    expect(COMPRESSION_ATTEMPTS[0]).toEqual({ maxSide: 2000, quality: 0.8 });
    for (let i = 1; i < COMPRESSION_ATTEMPTS.length; i++) {
      const prev = COMPRESSION_ATTEMPTS[i - 1];
      const cur = COMPRESSION_ATTEMPTS[i];
      expect(cur.maxSide < prev.maxSide || (cur.maxSide === prev.maxSide && cur.quality < prev.quality)).toBe(true);
      expect(cur.quality).toBeGreaterThanOrEqual(0.5);
    }
  });
});

describe("formatBytes", () => {
  it("shows KB under 1 MB and MB above", () => {
    expect(formatBytes(900 * KB)).toBe("900 KB");
    expect(formatBytes(1_650_000)).toBe("1.6 MB");
  });
});

describe("isPreviewableImage", () => {
  it("previews browser images only", () => {
    expect(isPreviewableImage(file("r.png", "image/png"))).toBe(true);
    expect(isPreviewableImage(file("r.heic", "image/heic"))).toBe(false);
    expect(isPreviewableImage(file("r.pdf", "application/pdf"))).toBe(false);
  });
});
