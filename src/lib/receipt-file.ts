/** Payment receipt rules (spec 002 BR3, spec 003). */

/**
 * Largest receipt file the app sends. The VPS nginx rejects requests over 1 MB, and that includes
 * the other form fields, so the file stays safely below it (spec 003 BR1). Change it here only.
 */
export const RECEIPT_UPLOAD_LIMIT_BYTES = 900 * 1024;

/** Largest file a user may pick; bigger photos are refused before decoding to protect phones (BR4). */
export const RECEIPT_MAX_SOURCE_BYTES = 20 * 1024 * 1024;

/** Resize/quality steps tried in order until the photo fits the limit (BR2). */
export const COMPRESSION_ATTEMPTS: readonly { maxSide: number; quality: number }[] = [
  { maxSide: 2000, quality: 0.8 },
  { maxSide: 2000, quality: 0.7 },
  { maxSide: 2000, quality: 0.6 },
  { maxSide: 2000, quality: 0.5 },
  { maxSide: 1600, quality: 0.6 },
  { maxSide: 1600, quality: 0.5 },
  { maxSide: 1280, quality: 0.6 },
  { maxSide: 1280, quality: 0.5 },
];

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HEIC_TYPES = ["image/heic", "image/heif"];
const ALLOWED_TYPES = [...PHOTO_TYPES, ...HEIC_TYPES, "application/pdf"];

/** Value for `<input accept>`. Extensions included because some browsers report HEIC without a MIME type. */
export const RECEIPT_ACCEPT = [...ALLOWED_TYPES, ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".pdf"].join(",");

/** "900 KB", "1.6 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Number((bytes / 1024 / 1024).toFixed(1))} MB`;
}

const LIMIT_LABEL = formatBytes(RECEIPT_UPLOAD_LIMIT_BYTES);

export const RECEIPT_MESSAGES = {
  wrongType: "Receipt must be a JPG, PNG, WEBP, HEIC image or a PDF.",
  empty: "This file is empty.",
  tooLargeSource: `This file is larger than ${formatBytes(RECEIPT_MAX_SOURCE_BYTES)}. Please upload a smaller photo or a screenshot of the receipt.`,
  pdfTooLarge: `This PDF is larger than ${LIMIT_LABEL}. Please upload a photo or screenshot of the receipt instead.`,
  heicUnreadable: "This HEIC photo can't be resized in this browser. Please upload a JPG photo or a screenshot of the receipt instead.",
  imageUnreadable: "This image couldn't be read. Please try another photo or a screenshot of the receipt.",
  stillTooLarge: `This image is still larger than ${LIMIT_LABEL} after resizing. Please upload a screenshot of the receipt instead.`,
};

/** MIME type to send; fills in HEIC/HEIF when the browser left it blank. */
export function receiptMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "";
}

export type ReceiptPlan =
  | { action: "accept" }
  | { action: "compress"; unreadableMessage: string }
  | { action: "reject"; message: string };

/**
 * What to do with a picked receipt (spec 003): upload it as is, shrink it in the browser, or refuse
 * it with a message. `allowHeic: false` (SMS campaigns) means HEIC must be converted to JPEG.
 */
export function planReceipt(file: File, { allowHeic = true }: { allowHeic?: boolean } = {}): ReceiptPlan {
  const type = receiptMimeType(file);
  if (!ALLOWED_TYPES.includes(type)) return { action: "reject", message: RECEIPT_MESSAGES.wrongType };
  if (file.size === 0) return { action: "reject", message: RECEIPT_MESSAGES.empty };
  if (file.size > RECEIPT_MAX_SOURCE_BYTES) return { action: "reject", message: RECEIPT_MESSAGES.tooLargeSource };

  const fits = file.size <= RECEIPT_UPLOAD_LIMIT_BYTES;
  if (type === "application/pdf") {
    return fits ? { action: "accept" } : { action: "reject", message: RECEIPT_MESSAGES.pdfTooLarge };
  }
  if (HEIC_TYPES.includes(type)) {
    return fits && allowHeic
      ? { action: "accept" }
      : { action: "compress", unreadableMessage: RECEIPT_MESSAGES.heicUnreadable };
  }
  return fits ? { action: "accept" } : { action: "compress", unreadableMessage: RECEIPT_MESSAGES.imageUnreadable };
}

/** Whether the browser can show a thumbnail (HEIC and PDF cannot be previewed as <img>). */
export function isPreviewableImage(file: File): boolean {
  return PHOTO_TYPES.includes(file.type);
}

/** File to upload, with the MIME type filled in when the browser left it blank (the API checks it). */
export function asUploadFile(file: File): File {
  if (file.type) return file;
  return new File([file], file.name, { type: receiptMimeType(file), lastModified: file.lastModified });
}
