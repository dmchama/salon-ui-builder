import { apiRequest } from "./http";
import type { SalonRecord } from "./salon-api";

export type OwnerDashboardInsights = {
  totals: {
    bookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    activeServices: number;
    completedRevenueCents: number;
    uniqueGuestContacts: number;
  };
  pendingBySalonId: Record<string, number>;
  revenueByService: { serviceId: string; name: string; totalCents: number }[];
  bookingsLast7Days: { date: string; count: number }[];
  bookingsByWeek: { weekLabel: string; count: number }[];
};

export type OwnerSubscription = {
  id: string;
  ownerId: string;
  planId: string;
  status: string;
  expiresAt: string;
  plan: {
    id: string;
    name: string;
    priceCents: number;
    currency: string;
    intervalMonths: number;
  };
};

export type OwnerDashboardSalon = SalonRecord & {
  _count: { bookings: number; services: number };
};

export type OwnerDashboard = {
  salons: OwnerDashboardSalon[];
  subscription: OwnerSubscription | null;
  insights: OwnerDashboardInsights;
};

export async function fetchOwnerDashboard(): Promise<OwnerDashboard> {
  return apiRequest<OwnerDashboard>("/salon-owners/me/dashboard", { method: "GET" });
}

// ── SMS Campaign (salon-scoped) ───────────────────────────────────────────

export type OwnerCampaignCustomer = {
  name: string;
  phone: string;
  email: string | null;
  bookingCount: number;
};

export type OwnerCampaignService = {
  id: string;
  name: string;
  salonName: string;
  priceCents: number;
  durationMin: number;
};

export type OwnerCampaignCustomersResponse = {
  customers: OwnerCampaignCustomer[];
  count: number;
};

export type SendOwnerSmsCampaignPayload = {
  salonId: string;
  campaignName: string;
  segment: string;
  discountPct: number;
  discountScope: "all_services" | "specific_service" | "multiple_services";
  serviceIds: string[];
  validFrom: string;
  validTo: string;
  customLink: string;
  message: string;
  scheduledAt?: string;
  recipientCount: number;
};

export async function fetchOwnerCampaignCustomers(salonId: string, segment: string): Promise<OwnerCampaignCustomersResponse> {
  return apiRequest<OwnerCampaignCustomersResponse>(`/salon-owners/campaign/customers?salonId=${salonId}&segment=${segment}`, { method: "GET" });
}

export async function fetchOwnerCampaignServices(salonId: string): Promise<OwnerCampaignService[]> {
  return apiRequest<OwnerCampaignService[]>(`/salon-owners/campaign/services?salonId=${salonId}`, { method: "GET" });
}

export async function sendOwnerSmsCampaign(payload: SendOwnerSmsCampaignPayload): Promise<{ message: string; recipientCount: number }> {
  return apiRequest("/salon-owners/campaign/sms", { method: "POST", body: JSON.stringify(payload) });
}
