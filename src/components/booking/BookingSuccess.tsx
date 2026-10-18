import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { BookingCreated } from "@/api/bookings-api";
import type { PublicSalonDetail, PublicSalonService, PublicSalonTechnician } from "@/api/salon-api";

type Props = {
  booking: BookingCreated;
  salon: PublicSalonDetail;
  service?: PublicSalonService;
  technicians: PublicSalonTechnician[];
  paymentOption: string;
};

/** Booking confirmed view (moved unchanged from the old Booking page). */
const BookingSuccess = ({ booking, salon, service, technicians, paymentOption }: Props) => {
  const locationLine = [salon.address, salon.city, salon.country].filter(Boolean).join(" · ");
  const preferredTechRow =
    booking.technician ?? technicians.find((t) => t.id === booking.technicianId) ?? null;

  return (
    <div className="pt-32 container max-w-lg text-center py-16 space-y-8">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>
      </motion.div>

      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Booking Confirmed!</h1>
        <p className="text-gray-500 leading-relaxed">
          Your appointment at <strong className="font-semibold text-gray-900">{salon.name}</strong> is confirmed.
        </p>
        <p className="text-xs text-gray-400">
          Reference <span className="font-mono text-gray-600">{booking.id}</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 text-left space-y-3">
        {locationLine && (
          <div className="flex justify-between text-sm py-2.5 border-b border-gray-100 gap-4">
            <span className="text-gray-400">Location</span>
            <span className="font-semibold text-gray-900 text-right">{locationLine}</span>
          </div>
        )}
        <div className="flex justify-between text-sm py-2.5 border-b border-gray-100">
          <span className="text-gray-400">Service</span>
          <span className="font-semibold text-gray-900">{service?.name}</span>
        </div>
        {service && (
          <>
            <div className="flex justify-between text-sm py-2.5 border-b border-gray-100">
              <span className="text-gray-400">Duration</span>
              <span className="font-semibold text-gray-900">{service.durationMin} min</span>
            </div>
            <div className="flex justify-between text-sm py-2.5 border-b border-gray-100">
              <span className="text-gray-400">Price</span>
              {booking.discountPct ? (
                <span className="text-right">
                  <span className="line-through text-gray-300 text-xs mr-2">
                    Rs. {(service.priceCents / 100).toLocaleString()}
                  </span>
                  <span className="font-semibold text-gold">
                    Rs. {Math.round((service.priceCents * (1 - booking.discountPct / 100)) / 100).toLocaleString()}
                  </span>
                </span>
              ) : (
                <span className="font-semibold text-gray-900">Rs. {(service.priceCents / 100).toLocaleString()}</span>
              )}
            </div>
            {booking.discountPct ? (
              <div className="flex justify-between text-sm py-2.5 border-b border-gray-100">
                <span className="text-gray-400">Discount</span>
                <span className="font-semibold text-gold">{booking.discountPct}% off</span>
              </div>
            ) : null}
          </>
        )}
        <div className="flex justify-between text-sm py-2.5 border-b border-gray-100">
          <span className="text-gray-400">Starts</span>
          <span className="font-semibold text-gray-900">
            {new Date(booking.startAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Colombo",
            })}
          </span>
        </div>
        {preferredTechRow && (
          <div className="flex justify-between text-sm py-2.5 border-b border-gray-100 gap-4">
            <span className="text-gray-400 shrink-0">Technician</span>
            <span className="font-semibold text-gray-900 text-right">
              {preferredTechRow.name}
              {preferredTechRow.specialization ? ` · ${preferredTechRow.specialization}` : ""}
            </span>
          </div>
        )}
        <div className={`flex justify-between text-sm py-2.5 ${salon.contactPhone ? "border-b border-gray-100" : ""}`}>
          <span className="text-gray-400">Payment</span>
          <span className="font-semibold text-gray-900">{paymentOption === "pay-now" ? "Pay online" : "Pay at salon"}</span>
        </div>
        {salon.contactPhone && (
          <div className="flex justify-between text-sm py-2.5">
            <span className="text-gray-400">Contact</span>
            <a href={`tel:${salon.contactPhone}`} className="font-semibold text-gold hover:underline">
              {salon.contactPhone}
            </a>
          </div>
        )}
      </div>

      {salon.contactPhone && (
        <p className="text-xs text-gray-400 text-center">
          Need to cancel or reschedule?{" "}
          <a href={`tel:${salon.contactPhone}`} className="text-gold hover:underline font-medium">
            Call {salon.contactPhone}
          </a>
        </p>
      )}

      <Link to="/" className="block mt-4">
        <Button className="rounded-full bg-gold hover:bg-gold/90 text-white px-8 h-12 font-semibold transition-all duration-200 hover:scale-105">
          Return to Home
        </Button>
      </Link>
    </div>
  );
};

export default BookingSuccess;
