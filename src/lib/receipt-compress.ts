import {
  COMPRESSION_ATTEMPTS,
  planReceipt,
  RECEIPT_MESSAGES,
  RECEIPT_UPLOAD_LIMIT_BYTES,
} from "./receipt-file";

/** Browser-side receipt shrinking (spec 003 BR2, BR3, BR7). The original file never leaves the browser. */

class ReceiptCompressionError extends Error {
  constructor(public readonly reason: "unreadable" | "tooLarge") {
    super(reason);
  }
}

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      // "from-image" keeps rotated phone photos upright.
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // fall through to <img>, which some browsers (e.g. Safari for HEIC) decode better
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new ReceiptCompressionError("unreadable");
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

function jpgName(name: string): string {
  const dot = name.lastIndexOf(".");
  return `${dot > 0 ? name.slice(0, dot) : name}.jpg`;
}

/** Re-encode a photo as JPEG, trying each size/quality step until it fits the upload limit. */
export async function compressImage(file: File, limit = RECEIPT_UPLOAD_LIMIT_BYTES): Promise<File> {
  const image = await decode(file);
  try {
    if (!image.width || !image.height) throw new ReceiptCompressionError("unreadable");
    for (const { maxSide, quality } of COMPRESSION_ATTEMPTS) {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new ReceiptCompressionError("unreadable");
      ctx.fillStyle = "#ffffff"; // PNG transparency → white (BR3)
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image.source, 0, 0, canvas.width, canvas.height);
      const blob = await canvasToJpeg(canvas, quality);
      if (blob && blob.size <= limit) {
        return new File([blob], jpgName(file.name), { type: "image/jpeg", lastModified: Date.now() });
      }
    }
    throw new ReceiptCompressionError("tooLarge");
  } finally {
    image.release();
  }
}

export type PreparedReceipt = { file: File; originalSize?: number } | { error: string };

/** Turn a picked file into the file to upload: unchanged, shrunk, or an error message for the user. */
export async function prepareReceipt(file: File, opts: { allowHeic?: boolean } = {}): Promise<PreparedReceipt> {
  const plan = planReceipt(file, opts);
  if (plan.action === "reject") return { error: plan.message };
  if (plan.action === "accept") return { file };
  try {
    return { file: await compressImage(file), originalSize: file.size };
  } catch (err) {
    if (err instanceof ReceiptCompressionError && err.reason === "tooLarge") {
      return { error: RECEIPT_MESSAGES.stillTooLarge };
    }
    return { error: plan.unreadableMessage };
  }
}
