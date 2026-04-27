import { apiRequest } from "./http";

export type SubscriptionPlanDto = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  intervalMonths: number;
  features: unknown;
  active: boolean;
};

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlanDto[]> {
  return apiRequest<SubscriptionPlanDto[]>("/subscription-plans", { method: "GET" });
}
