import { apiRequest } from "./http";
import type { PublicSalonService } from "./salon-api";

export type ManageService = PublicSalonService;

export type CreateManagedServicePayload = {
  salonId: string;
  name: string;
  description?: string;
  durationMin: number;
  priceCents: number;
};

export type UpdateManagedServicePayload = Partial<{
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  active: boolean;
}>;

export async function fetchManagedServices(salonId: string): Promise<ManageService[]> {
  return apiRequest<ManageService[]>(`/services/manage/salon/${encodeURIComponent(salonId)}`, {
    method: "GET",
  });
}

export async function createManagedService(payload: CreateManagedServicePayload): Promise<ManageService> {
  return apiRequest<ManageService>("/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateManagedService(
  serviceId: string,
  payload: UpdateManagedServicePayload,
): Promise<ManageService> {
  return apiRequest<ManageService>(`/services/${encodeURIComponent(serviceId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
