/** Helpers for team member avatars (spec 005). */

/** "Ishara Silva" → "IS", "Dilini" → "D". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Small face-centred square for a Cloudinary image, at 2× the display size for sharp screens.
 * Other URLs are returned unchanged.
 */
export function cloudinaryThumb(url: string, displayPx: number): string {
  const marker = "/image/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  const px = displayPx * 2;
  return url.replace(marker, `${marker}c_fill,g_face,w_${px},h_${px},q_auto,f_auto/`);
}
