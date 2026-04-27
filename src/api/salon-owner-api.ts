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
