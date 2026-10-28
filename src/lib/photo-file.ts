import { compressImage } from "./receipt-compress";
import {
  receiptMimeType,
  RECEIPT_MAX_SOURCE_BYTES,
  RECEIPT_UPLOAD_LIMIT_BYTES,
  type ReceiptPlan,
} from "./receipt-file";

/** Team member photo rules (spec 005): same size limits and resizing as receipts, images only. */

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HEIC_TYPES = ["image/heic", "image/heif"];

export const PHOTO_ACCEPT = [...PHOTO_TYPES, ...HEIC_TYPES, ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"].join(",");

export const PHOTO_MESSAGES = {
  wrongType: "Photo must be a JPG, PNG, WEBP or HEIC image.",
  empty: "This file is empty.",
  tooLargeSource: "This photo is larger than 20 MB. Please choose a smaller one.",
  unreadable: "This photo couldn't be read. Please try another one.",
  heicUnreadable: "This HEIC photo can't be converted in this browser. Please choose a JPG or PNG.",
  stillTooLarge: "This photo is still too large after resizing. Please choose another one.",
};

export function planPhoto(file: File): ReceiptPlan {
  const type = receiptMimeType(file);
  const isHeic = HEIC_TYPES.includes(type);
  if (!PHOTO_TYPES.includes(type) && !isHeic) return { action: "reject", message: PHOTO_MESSAGES.wrongType };
  if (file.size === 0) return { action: "reject", message: PHOTO_MESSAGES.empty };
  if (file.size > RECEIPT_MAX_SOURCE_BYTES) return { action: "reject", message: PHOTO_MESSAGES.tooLargeSource };
  if (isHeic) return { action: "compress", unreadableMessage: PHOTO_MESSAGES.heicUnreadable };
  return file.size <= RECEIPT_UPLOAD_LIMIT_BYTES
    ? { action: "accept" }
    : { action: "compress", unreadableMessage: PHOTO_MESSAGES.unreadable };
}

/** Photo to upload (unchanged or resized to JPEG), or a message for the owner. */
export async function preparePhoto(file: File): Promise<{ file: File } | { error: string }> {
  const plan = planPhoto(file);
  if (plan.action === "reject") return { error: plan.message };
  if (plan.action === "accept") return { file };
  try {
    return { file: await compressImage(file) };
  } catch (err) {
    return { error: err instanceof Error && err.message === "tooLarge" ? PHOTO_MESSAGES.stillTooLarge : plan.unreadableMessage };
  }
}
