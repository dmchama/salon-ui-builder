import { apiRequest } from "./http";
import type { PublicSalonGalleryItem } from "./salon-api";

export type GalleryItemRecord = PublicSalonGalleryItem;

export async function fetchGalleryForSalon(salonId: string): Promise<GalleryItemRecord[]> {
  return apiRequest<GalleryItemRecord[]>(`/gallery/salon/${encodeURIComponent(salonId)}`, {
    method: "GET",
    skipAuth: true,
  });
}

export type AddGalleryPayload = {
  salonId: string;
  url: string;
  caption?: string;
};

export async function addGalleryItem(payload: AddGalleryPayload): Promise<GalleryItemRecord & { sortOrder?: number }> {
  return apiRequest(`/gallery`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteGalleryItem(itemId: string): Promise<void> {
  await apiRequest(`/gallery/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}
