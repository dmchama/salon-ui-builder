import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compressImage, prepareReceipt } from "./receipt-compress";
import { RECEIPT_MESSAGES, RECEIPT_UPLOAD_LIMIT_BYTES } from "./receipt-file";

const file = (name: string, type: string, size: number) => new File([new Uint8Array(size)], name, { type });

/** Fake encoder: output size = pixels × quality × bytesPerPixel, so smaller attempts give smaller files. */
let bytesPerPixel = 0.2;
const drawn: { width: number; height: number; quality: number }[] = [];

beforeEach(() => {
  drawn.length = 0;
  bytesPerPixel = 0.2;
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ width: 4000, height: 3000, close: vi.fn() }),
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    fillStyle: "",
    fillRect: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    cb: BlobCallback,
    _type?: string,
    quality?: number,
  ) {
    drawn.push({ width: this.width, height: this.height, quality: quality ?? 1 });
    const size = Math.round(this.width * this.height * (quality ?? 1) * bytesPerPixel);
    cb(new Blob([new Uint8Array(size)], { type: "image/jpeg" }));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("compressImage (spec 003)", () => {
  it("resizes to 2000 px on the long side and stops at the first attempt that fits (AC1, AC3)", async () => {
    // 2000×1500 × 0.8 × 0.2 = 480 000 bytes → fits on the first try
    const out = await compressImage(file("slip.PNG", "image/png", 5_000_000));
    expect(drawn).toEqual([{ width: 2000, height: 1500, quality: 0.8 }]);
    expect(out.type).toBe("image/jpeg");
    expect(out.name).toBe("slip.jpg");
    expect(out.size).toBeLessThanOrEqual(RECEIPT_UPLOAD_LIMIT_BYTES);
  });

  it("steps down quality, then size, until the result fits (AC2)", async () => {
    bytesPerPixel = 1; // 2000×1500@0.5 = 1.5 MB, 1600×1200@0.5 = 960 000 — too big; 1280×960@0.6 = 737 280 fits
    const out = await compressImage(file("slip.jpg", "image/jpeg", 8_000_000));
    expect(drawn.length).toBeGreaterThan(1);
    expect(drawn.at(-1)).toEqual({ width: 1280, height: 960, quality: 0.6 });
    expect(out.size).toBeLessThanOrEqual(RECEIPT_UPLOAD_LIMIT_BYTES);
  });

  it("never upscales a smaller image", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 1200, height: 900, close: vi.fn() }));
    await compressImage(file("small.png", "image/png", 1_000_000));
    expect(drawn[0]).toMatchObject({ width: 1200, height: 900 });
  });
});

describe("prepareReceipt (spec 003)", () => {
  it("passes small files and PDFs through untouched (AC4, AC9, BR5)", async () => {
    const pdf = file("r.pdf", "application/pdf", 500_000);
    expect(await prepareReceipt(pdf)).toEqual({ file: pdf });
    expect(drawn).toHaveLength(0);
  });

  it("returns the compressed file and the original size for a large photo (AC1)", async () => {
    const result = await prepareReceipt(file("slip.jpg", "image/jpeg", 6_000_000));
    expect(result).toMatchObject({ originalSize: 6_000_000 });
    expect("file" in result && result.file.type).toBe("image/jpeg");
  });

  it("rejects a large PDF without decoding it (AC7)", async () => {
    expect(await prepareReceipt(file("r.pdf", "application/pdf", 1_650_000))).toEqual({
      error: RECEIPT_MESSAGES.pdfTooLarge,
    });
  });

  it("reports an unreadable photo (AC6)", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("decode")));
    expect(await prepareReceipt(file("broken.jpg", "image/jpeg", 2_000_000))).toEqual({
      error: RECEIPT_MESSAGES.imageUnreadable,
    });
  });

  it("reports a HEIC the browser can't read (AC8)", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("decode")));
    expect(await prepareReceipt(file("IMG_1.heic", "image/heic", 2_000_000))).toEqual({
      error: RECEIPT_MESSAGES.heicUnreadable,
    });
  });

  it("reports a photo that is still too large after every attempt", async () => {
    bytesPerPixel = 10;
    expect(await prepareReceipt(file("huge.png", "image/png", 9_000_000))).toEqual({
      error: RECEIPT_MESSAGES.stillTooLarge,
    });
  });
});
