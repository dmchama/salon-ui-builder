import { apiRequest } from "./http";
import { asUploadFile } from "@/lib/receipt-file";
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

/** Registers a salon owner with the payment receipt (multipart, spec 002). */
export async function registerSalonAdmin(payload: RegisterSalonAdminPayload, receipt: File): Promise<AuthResponse> {
  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== "") form.append(key, value);
  }
  form.append("receipt", asUploadFile(receipt));
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: form,
  });
}
