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
  status: "DRAFT" | "PUBLISHED" | "SUSPENDED";
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
