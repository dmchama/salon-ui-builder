import { apiRequest } from "./http";
import type { PublicSalonTechnician } from "./salon-api";

export type ManagedTechnician = PublicSalonTechnician;

export type CreateTechnicianPayload = {
  salonId: string;
  name: string;
  phone?: string;
  email?: string;
  specialization?: string;
  sortOrder?: number;
};

export type UpdateTechnicianPayload = Partial<{
  name: string;
  phone: string;
  email: string;
  specialization: string;
  active: boolean;
  sortOrder: number;
}>;

export async function fetchManagedTechnicians(salonId: string): Promise<ManagedTechnician[]> {
  return apiRequest<ManagedTechnician[]>(
    `/technicians/manage/salon/${encodeURIComponent(salonId)}`,
    { method: "GET" },
  );
}

export async function createTechnician(payload: CreateTechnicianPayload): Promise<ManagedTechnician> {
  return apiRequest<ManagedTechnician>("/technicians", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTechnician(
  technicianId: string,
  payload: UpdateTechnicianPayload,
): Promise<ManagedTechnician> {
  return apiRequest<ManagedTechnician>(`/technicians/${encodeURIComponent(technicianId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
