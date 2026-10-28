import { apiRequest } from "./http";

export type SalonRecord = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  websiteUrl?: string | null;
  businessHours?: Record<string, unknown> | null;
  coverImageUrl?: string | null;
  listingImageUrl?: string | null;
  status: "DRAFT" | "PUBLISHED" | "SUSPENDED";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateSalonPayload = {
  name: string;
  slug: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  contactPhone?: string;
  contactEmail?: string;
  websiteUrl?: string;
  businessHours?: Record<string, unknown> | null;
};

export async function fetchMySalons(): Promise<SalonRecord[]> {
  return apiRequest<SalonRecord[]>("/salons/mine", { method: "GET" });
}

export async function createSalon(payload: CreateSalonPayload): Promise<SalonRecord> {
  return apiRequest<SalonRecord>("/salons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSalon(id: string, payload: Partial<CreateSalonPayload>): Promise<SalonRecord> {
  return apiRequest<SalonRecord>(`/salons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function publishSalon(id: string): Promise<SalonRecord> {
  return apiRequest<SalonRecord>(`/salons/${id}/publish`, {
    method: "POST",
  });
}

export type PublicSalonService = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number;
  active: boolean;
};

export type PublicSalonGalleryItem = {
  id: string;
  url: string;
  caption: string | null;
};

export type PublicSalonTechnician = {
  id: string;
  salonId: string;
  name: string;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  /** Public team photo (Cloudinary), feature 005. */
  photoUrl: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicSalonDetail = SalonRecord & {
  services: PublicSalonService[];
  /** Present when API returns salon detail with staff list */
  technicians?: PublicSalonTechnician[];
  gallery: PublicSalonGalleryItem[];
};

export async function fetchPublicSalonBySlug(slug: string): Promise<PublicSalonDetail> {
  return apiRequest<PublicSalonDetail>(`/salons/public/${encodeURIComponent(slug)}`, {
    method: "GET",
  });
}

export type SalonBranch = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  country: string | null;
  isDefault: boolean;
};

export async function fetchSalonBranches(slug: string): Promise<SalonBranch[]> {
  return apiRequest<SalonBranch[]>(`/salons/public/${encodeURIComponent(slug)}/branches`, {
    method: "GET",
  });
}

export async function setDefaultBranch(id: string): Promise<SalonRecord> {
  return apiRequest<SalonRecord>(`/salons/${id}/default`, { method: "PATCH" });
}

export async function uploadSalonListingImage(id: string, file: File): Promise<SalonRecord> {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<SalonRecord>(`/salons/${id}/listing-image`, { method: "PATCH", body: form });
}

export async function setSalonCoverImage(id: string, galleryItemId: string | null): Promise<SalonRecord> {
  return apiRequest<SalonRecord>(`/salons/${id}/cover`, {
    method: "PATCH",
    body: JSON.stringify({ galleryItemId }),
  });
}
