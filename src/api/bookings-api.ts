import { apiRequest } from "./http";

export type BookingTechnician = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  active: boolean;
};

export type BookingCreated = {
  id: string;
  customerId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  salonId: string;
  serviceId: string;
  technicianId: string | null;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  technician?: BookingTechnician | null;
};

export type CreateBookingPayload = {
  salonId: string;
  serviceId: string;
  /** ISO 8601 date-time string */
  startAt: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  notes?: string;
  technicianId?: string;
};

/** Public endpoint — never sends JWT (guest booking). */
export async function createGuestBooking(payload: CreateBookingPayload): Promise<BookingCreated> {
  return apiRequest<BookingCreated>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export type BookingCustomer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
};

export type BookingService = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number;
  active: boolean;
};

export type SalonBookingRow = {
  id: string;
  salonId: string;
  serviceId: string;
  technicianId: string | null;
  customerId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  customer: BookingCustomer | null;
  service: BookingService;
  technician: BookingTechnician | null;
};

export async function fetchSalonBookings(salonId: string): Promise<SalonBookingRow[]> {
  return apiRequest<SalonBookingRow[]>(`/bookings/salon/${encodeURIComponent(salonId)}`, {
    method: "GET",
  });
}

export async function updateBookingStatus(bookingId: string, status: string): Promise<SalonBookingRow> {
  return apiRequest<SalonBookingRow>(`/bookings/${encodeURIComponent(bookingId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function rescheduleBooking(bookingId: string, startAt: string): Promise<SalonBookingRow> {
  return apiRequest<SalonBookingRow>(`/bookings/${encodeURIComponent(bookingId)}/schedule`, {
    method: "PATCH",
    body: JSON.stringify({ startAt }),
  });
}
