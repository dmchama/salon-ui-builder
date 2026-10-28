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
  revenueTotalCents: number;
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

// ── Website Settings ──────────────────────────────────────────────────────

export type WebsiteHeroSlide = {
  id: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
};

export type PaymentDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  instructions: string;
};

export type WebsiteSettings = {
  heroSlides: WebsiteHeroSlide[];
  footerText: string;
  supportEmail: string;
  metaTitle: string;
  metaDescription: string;
  /** null when not configured (spec 002 AC21) */
  paymentDetails: PaymentDetails | null;
};

export async function fetchWebsiteSettings(): Promise<WebsiteSettings> {
  return apiRequest<WebsiteSettings>("/admin/website", { method: "GET" });
}

export async function fetchPublicWebsiteSettings(): Promise<WebsiteSettings> {
  return apiRequest<WebsiteSettings>("/website-settings", { method: "GET" });
}

export async function saveHeroSlides(slides: WebsiteHeroSlide[]): Promise<void> {
  return apiRequest<void>("/admin/website/hero-slides", { method: "PATCH", body: JSON.stringify({ slides }) });
}

export async function saveFooterSettings(data: { footerText: string; supportEmail: string }): Promise<void> {
  return apiRequest<void>("/admin/website/footer", { method: "PATCH", body: JSON.stringify(data) });
}

export async function saveSeoSettings(data: { metaTitle: string; metaDescription: string }): Promise<void> {
  return apiRequest<void>("/admin/website/seo", { method: "PATCH", body: JSON.stringify(data) });
}

export type PaymentDetailsInput = Omit<PaymentDetails, "branch" | "instructions"> & {
  branch?: string;
  instructions?: string;
};

export async function savePaymentDetails(data: PaymentDetailsInput): Promise<{ paymentDetails: PaymentDetails | null }> {
  return apiRequest("/admin/website/payment-details", { method: "PATCH", body: JSON.stringify(data) });
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
  /** Latest registration payment (spec 002), null when none was uploaded. */
  registrationPayment: { id: string; status: RegistrationPaymentStatus; createdAt: string } | null;
};

// ── Registration payments (spec 002) ──────────────────────────────────────

export type RegistrationPaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AdminRegistrationPaymentDto = {
  owner: { id: string; displayName: string; email: string; accountStatus: "PENDING" | "ACTIVE" | "SUSPENDED" };
  payment: {
    id: string;
    status: RegistrationPaymentStatus;
    amountCents: number;
    currency: string;
    planName: string;
    rejectionReason: string | null;
    createdAt: string;
    reviewedAt: string | null;
    receiptFormat: string;
    receiptUrl: string;
  } | null;
  history: { id: string; status: RegistrationPaymentStatus; rejectionReason: string | null; createdAt: string; reviewedAt: string | null }[];
};

export async function fetchOwnerRegistrationPayment(ownerId: string): Promise<AdminRegistrationPaymentDto> {
  return apiRequest<AdminRegistrationPaymentDto>(`/admin/owners/${ownerId}/registration-payment`, { method: "GET" });
}

export async function approveRegistrationPayment(id: string): Promise<{ message: string; ownerId: string }> {
  return apiRequest(`/admin/registration-payments/${id}/approve`, { method: "PATCH" });
}

export async function rejectRegistrationPayment(id: string, reason: string): Promise<{ message: string; ownerId: string }> {
  return apiRequest(`/admin/registration-payments/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) });
}

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

// ── SMS Campaign ──────────────────────────────────────────────────────────

export type CampaignCustomer = {
  name: string;
  phone: string;
  email: string | null;
  bookingCount: number;
};

export type CampaignCustomersResponse = {
  customers: CampaignCustomer[];
  count: number;
};

export type CampaignService = {
  id: string;
  name: string;
  salonName: string;
  priceCents: number;
  durationMin: number;
};

export type SendSmsCampaignPayload = {
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

export async function fetchCampaignCustomers(segment: string): Promise<CampaignCustomersResponse> {
  return apiRequest<CampaignCustomersResponse>(`/admin/campaign/customers?segment=${segment}`, { method: "GET" });
}

export async function fetchCampaignServices(): Promise<CampaignService[]> {
  return apiRequest<CampaignService[]>("/admin/campaign/services", { method: "GET" });
}

export async function sendSmsCampaign(payload: SendSmsCampaignPayload): Promise<{ message: string; recipientCount: number }> {
  return apiRequest("/admin/campaign/sms", { method: "POST", body: JSON.stringify(payload) });
}

// ── SMS Campaign Price & Requests ─────────────────────────────────────────

export async function fetchSmsCampaignPrice(): Promise<{ priceCents: number }> {
  return apiRequest<{ priceCents: number }>("/admin/sms-price", { method: "GET" });
}

export async function saveSmsCampaignPrice(priceCents: number): Promise<{ priceCents: number }> {
  return apiRequest<{ priceCents: number }>("/admin/sms-price", { method: "PATCH", body: JSON.stringify({ priceCents }) });
}

export type AdminCampaignRequestDto = {
  id: string;
  campaignName: string;
  segment: string;
  discountPct: number;
  discountScope: string;
  serviceIds: string[] | null;
  validFrom: string | null;
  validTo: string | null;
  message: string;
  recipientCount: number;
  receiptUrl: string | null;
  priceCents: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: string;
  owner: { id: string; displayName: string; email: string };
  salon: { id: string; name: string; slug: string };
  promoCode: { code: string; usageCount: number; active: boolean } | null;
};

export type AdminPromoCodeDto = {
  id: string;
  code: string;
  salonName: string;
  campaignName: string | null;
  discountPct: number;
  discountScope: string;
  usageCount: number;
  usageLimit: number | null;
  validFrom: string | null;
  validTo: string | null;
  active: boolean;
  createdAt: string;
};

export async function fetchAdminPromoCodes(): Promise<AdminPromoCodeDto[]> {
  return apiRequest<AdminPromoCodeDto[]>("/admin/promo-codes", { method: "GET" });
}

export async function fetchAdminCampaignRequests(): Promise<AdminCampaignRequestDto[]> {
  return apiRequest<AdminCampaignRequestDto[]>("/admin/campaign-requests", { method: "GET" });
}

export async function approveAdminCampaignRequest(id: string): Promise<{ message: string; promoCode: string; salonSlug: string }> {
  return apiRequest(`/admin/campaign-requests/${id}/approve`, { method: "PATCH" });
}

export async function rejectAdminCampaignRequest(id: string, note: string): Promise<{ message: string }> {
  return apiRequest(`/admin/campaign-requests/${id}/reject`, { method: "PATCH", body: JSON.stringify({ note }) });
}

// ── Overage Pricing & Invoices ────────────────────────────────────────────

export async function fetchOveragePrice(): Promise<{ priceCents: number }> {
  return apiRequest<{ priceCents: number }>("/admin/overage-price", { method: "GET" });
}

export async function saveOveragePrice(priceCents: number): Promise<{ priceCents: number }> {
  return apiRequest<{ priceCents: number }>("/admin/overage-price", { method: "PATCH", body: JSON.stringify({ priceCents }) });
}

export type OverageInvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";

export type OverageInvoiceDto = {
  id: string;
  ownerId: string;
  year: number;
  month: number;
  bookingLimit: number;
  totalBookings: number;
  overageCount: number;
  overagePriceCents: number;
  totalCents: number;
  status: OverageInvoiceStatus;
  sentAt: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  owner: { id: string; firstName: string | null; lastName: string | null; email: string };
};

export async function generateOverageInvoices(year: number, month: number): Promise<{ generated: number }> {
  return apiRequest("/admin/overage-invoices/generate", { method: "POST", body: JSON.stringify({ year, month }) });
}

export async function fetchOverageInvoices(status?: OverageInvoiceStatus): Promise<OverageInvoiceDto[]> {
  const qs = status ? `?status=${status}` : "";
  return apiRequest<OverageInvoiceDto[]>(`/admin/overage-invoices${qs}`, { method: "GET" });
}

export async function sendOverageInvoice(id: string): Promise<OverageInvoiceDto> {
  return apiRequest<OverageInvoiceDto>(`/admin/overage-invoices/${id}/send`, { method: "PATCH" });
}

export async function markOverageInvoicePaid(id: string): Promise<OverageInvoiceDto> {
  return apiRequest<OverageInvoiceDto>(`/admin/overage-invoices/${id}/paid`, { method: "PATCH" });
}

export async function cancelOverageInvoice(id: string): Promise<OverageInvoiceDto> {
  return apiRequest<OverageInvoiceDto>(`/admin/overage-invoices/${id}/cancel`, { method: "PATCH" });
}
