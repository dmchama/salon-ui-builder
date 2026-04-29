import { apiRequest } from "./http";

export type SubscriptionPlanDto = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  intervalMonths: number;
  features: string[];
  active: boolean;
};

export type AdminPlanDto = SubscriptionPlanDto & { subscriberCount: number };

export type CreatePlanPayload = {
  name: string;
  description?: string;
  priceCents: number;
  currency?: string;
  intervalMonths?: number;
  features?: string[];
};

export type UpdatePlanPayload = Partial<CreatePlanPayload> & { active?: boolean };

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlanDto[]> {
  return apiRequest<SubscriptionPlanDto[]>("/subscription-plans", { method: "GET" });
}

export async function fetchAdminPlans(): Promise<AdminPlanDto[]> {
  return apiRequest<AdminPlanDto[]>("/subscription-plans/admin", { method: "GET" });
}

export async function createPlan(payload: CreatePlanPayload): Promise<SubscriptionPlanDto> {
  return apiRequest<SubscriptionPlanDto>("/subscription-plans", { method: "POST", body: JSON.stringify(payload) });
}

export async function updatePlan(id: string, payload: UpdatePlanPayload): Promise<SubscriptionPlanDto> {
  return apiRequest<SubscriptionPlanDto>(`/subscription-plans/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deletePlan(id: string): Promise<void> {
  return apiRequest<void>(`/subscription-plans/${id}`, { method: "DELETE" });
}
