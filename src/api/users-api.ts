import { apiRequest } from "./http";

export type MeUser = {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchMe(): Promise<MeUser> {
  return apiRequest<MeUser>("/users/me", { method: "GET" });
}
