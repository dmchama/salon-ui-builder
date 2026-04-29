import { apiRequest } from "./http";

export type AdminStatsOverview = {
  totalSalons: number;
  publishedSalons: number;
  draftSalons: number;
  suspendedSalons: number;
  newSalonsThisMonth: number;
  totalUsers: number;
  salonAdmins: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  totalBookings: number;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
  activeBookings: number;
  activeSubscriptions: number;
  revenueThisMonthCents: number;
  revenueLastMonthCents: number;
};

export type BookingByStatus = { status: string; count: number };
export type PlanDistributionItem = { name: string; count: number; pct: number };
export type MonthlyRevenue = { year: number; month: number; revenueCents: number };
export type MonthlyBookings = { year: number; month: number; count: number };

export type AdminStats = {
  overview: AdminStatsOverview;
  bookingsByStatus: BookingByStatus[];
  planDistribution: PlanDistributionItem[];
  monthlyRevenue: MonthlyRevenue[];
  monthlyBookings: MonthlyBookings[];
};

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>("/admin/stats", { method: "GET" });
}

export type OwnerSalon = { id: string; name: string; status: string };
export type OwnerSubscription = { planName: string; subStatus: string; expiresAt: string };

export type SalonOwnerDto = {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  joinedAt: string;
  status: "active" | "suspended" | "pending";
  salons: OwnerSalon[];
  subscription: OwnerSubscription | null;
};

export async function fetchOwners(): Promise<SalonOwnerDto[]> {
  return apiRequest<SalonOwnerDto[]>("/admin/owners", { method: "GET" });
}

export async function approveOwner(id: string): Promise<void> {
  return apiRequest<void>(`/admin/owners/${id}/approve`, { method: "PATCH" });
}

export async function suspendOwner(id: string): Promise<void> {
  return apiRequest<void>(`/admin/owners/${id}/suspend`, { method: "PATCH" });
}

export async function activateOwner(id: string): Promise<void> {
  return apiRequest<void>(`/admin/owners/${id}/activate`, { method: "PATCH" });
}

export type AdminSalonDto = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  status: "DRAFT" | "PUBLISHED" | "SUSPENDED";
  owner: { id: string; displayName: string; email: string };
  bookingCount: number;
  createdAt: string;
};

export async function fetchAdminSalons(): Promise<AdminSalonDto[]> {
  return apiRequest<AdminSalonDto[]>("/admin/salons", { method: "GET" });
}

export async function publishSalon(id: string): Promise<void> {
  return apiRequest<void>(`/admin/salons/${id}/publish`, { method: "PATCH" });
}

export async function suspendSalon(id: string): Promise<void> {
  return apiRequest<void>(`/admin/salons/${id}/suspend`, { method: "PATCH" });
}

export async function draftSalon(id: string): Promise<void> {
  return apiRequest<void>(`/admin/salons/${id}/draft`, { method: "PATCH" });
}
