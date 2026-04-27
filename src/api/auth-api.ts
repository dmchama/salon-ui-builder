import { apiRequest } from "./http";
import type { StoredUser } from "@/lib/auth-storage";

export type AuthResponse = {
  accessToken: string;
  user: StoredUser;
};

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export type RegisterSalonAdminPayload = {
  email: string;
  password: string;
  role: "SALON_ADMIN";
  firstName?: string;
  lastName?: string;
  subscriptionPlanId: string;
};

export async function registerSalonAdmin(payload: RegisterSalonAdminPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
