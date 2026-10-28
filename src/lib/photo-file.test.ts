import { describe, expect, it } from "vitest";
import { planPhoto } from "./photo-file";
import { RECEIPT_UPLOAD_LIMIT_BYTES } from "./receipt-file";

const file = (name: string, type: string, size = 1000) => new File([new Uint8Array(size)], name, { type });

describe("planPhoto (spec 005 AC6, AC7)", () => {
  it("accepts small JPG/PNG/WEBP as is", () => {
    for (const [n, t] of [["a.jpg", "image/jpeg"], ["a.png", "image/png"], ["a.webp", "image/webp"]]) {
      expect(planPhoto(file(n, t, 500 * 1024)).action).toBe("accept");
    }
  });

  it("resizes photos over the upload limit", () => {
    expect(planPhoto(file("a.jpg", "image/jpeg", RECEIPT_UPLOAD_LIMIT_BYTES + 1)).action).toBe("compress");
  });

  it("always converts HEIC (the API takes JPG/PNG/WEBP only)", () => {
    expect(planPhoto(file("IMG_1.HEIC", "", 200 * 1024)).action).toBe("compress");
  });

  it("rejects PDFs, other types, empty files and files over 20 MB", () => {
    expect(planPhoto(file("a.pdf", "application/pdf")).action).toBe("reject");
    expect(planPhoto(file("a.gif", "image/gif")).action).toBe("reject");
    expect(planPhoto(file("a.png", "image/png", 0)).action).toBe("reject");
    expect(planPhoto(file("a.png", "image/png", 20 * 1024 * 1024 + 1)).action).toBe("reject");
  });
});
