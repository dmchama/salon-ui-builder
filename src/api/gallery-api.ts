import { apiRequest } from "./http";
import type { PublicSalonGalleryItem } from "./salon-api";

export type GalleryItemRecord = PublicSalonGalleryItem;

export async function fetchGalleryForSalon(salonId: string): Promise<GalleryItemRecord[]> {
  return apiRequest<GalleryItemRecord[]>(`/gallery/salon/${encodeURIComponent(salonId)}`, {
    method: "GET",
    skipAuth: true,
  });
}

export async function uploadGalleryImage(
  salonId: string,
  file: File,
  caption?: string,
): Promise<GalleryItemRecord & { sortOrder?: number }> {
  const form = new FormData();
  form.append("file", file);
  form.append("salonId", salonId);
  if (caption?.trim()) form.append("caption", caption.trim());
  return apiRequest(`/gallery/upload`, { method: "POST", body: form });
}

export async function deleteGalleryItem(itemId: string): Promise<void> {
  await apiRequest(`/gallery/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}
