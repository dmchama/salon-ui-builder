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

export type SubmitCampaignRequestPayload = {
  salonId: string;
  campaignName: string;
  segment: string;
  discountPct: number;
  discountScope: "all_services" | "specific_service" | "multiple_services";
  serviceIds: string[];
  validFrom: string;
  validTo: string;
  message: string;
  scheduledAt?: string;
  recipientCount: number;
  receipt?: File;
};

export type CampaignHistoryRow = {
  id: string;
  campaignName: string;
  discountPct: number;
  discountScope: string;
  recipientCount: number;
  priceCents: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  validFrom: string | null;
  validTo: string | null;
  receiptUrl: string | null;
  createdAt: string;
  promoCode: { code: string; usageCount: number; active: boolean } | null;
};

export async function fetchOwnerCampaignCustomers(salonId: string, segment: string): Promise<OwnerCampaignCustomersResponse> {
  return apiRequest<OwnerCampaignCustomersResponse>(`/salon-owners/campaign/customers?salonId=${salonId}&segment=${segment}`, { method: "GET" });
}

export async function fetchOwnerCampaignServices(salonId: string): Promise<OwnerCampaignService[]> {
  return apiRequest<OwnerCampaignService[]>(`/salon-owners/campaign/services?salonId=${salonId}`, { method: "GET" });
}

export async function fetchOwnerSmsCampaignPrice(): Promise<{ priceCents: number }> {
  return apiRequest<{ priceCents: number }>("/salon-owners/campaign/sms-price", { method: "GET" });
}

export async function submitOwnerCampaignRequest(payload: SubmitCampaignRequestPayload): Promise<{ message: string; requestId: string }> {
  const form = new FormData();
  form.append("salonId", payload.salonId);
  form.append("campaignName", payload.campaignName);
  form.append("segment", payload.segment);
  form.append("discountPct", String(payload.discountPct));
  form.append("discountScope", payload.discountScope);
  form.append("serviceIds", JSON.stringify(payload.serviceIds));
  form.append("validFrom", payload.validFrom);
  form.append("validTo", payload.validTo);
  form.append("message", payload.message);
  form.append("recipientCount", String(payload.recipientCount));
  if (payload.scheduledAt) form.append("scheduledAt", payload.scheduledAt);
  if (payload.receipt) form.append("receipt", payload.receipt);
  return apiRequest("/salon-owners/campaign/request", { method: "POST", body: form });
}

export async function fetchOwnerCampaignHistory(salonId: string): Promise<CampaignHistoryRow[]> {
  return apiRequest<CampaignHistoryRow[]>(`/salon-owners/campaign/history?salonId=${salonId}`, { method: "GET" });
}
