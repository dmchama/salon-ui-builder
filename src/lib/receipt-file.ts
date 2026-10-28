/** Payment receipt rules — mirror of the backend's receipt-file.policy (spec 002 BR3). */

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];

/** Value for `<input accept>`. Extensions included because some browsers report HEIC without a MIME type. */
export const RECEIPT_ACCEPT = [...ALLOWED_TYPES, ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".pdf"].join(",");

/** MIME type to send; fills in HEIC/HEIF when the browser left it blank. */
export function receiptMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "";
}

/** Returns an error message, or null when the file can be uploaded. */
export function validateReceiptFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(receiptMimeType(file))) {
    return "Receipt must be a JPG, PNG, WEBP, HEIC image or a PDF.";
  }
  if (file.size === 0) return "This file is empty.";
  if (file.size > RECEIPT_MAX_BYTES) return "Receipt must be 5 MB or smaller.";
  return null;
}

/** Whether the browser can show a thumbnail (HEIC and PDF cannot be previewed as <img>). */
export function isPreviewableImage(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

/** File to upload, with the MIME type filled in when the browser left it blank (the API checks it). */
export function asUploadFile(file: File): File {
  if (file.type) return file;
  return new File([file], file.name, { type: receiptMimeType(file), lastModified: file.lastModified });
}
