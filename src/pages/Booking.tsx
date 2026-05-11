import { useParams, useSearchParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle, Loader2, Tag } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchPublicSalonBySlug } from "@/api/salon-api";
import { createGuestBooking, validatePromoCode, type BookingCreated, type PromoCodeInfo } from "@/api/bookings-api";
import { ApiError } from "@/api/http";
import { toast } from "sonner";

function combineLocalDateAndTime(dateStr: string, timeStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, (mo ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}

const inputClass =
  "rounded-xl border-0 bg-gray-100 h-12 px-4 text-sm text-gray-900 focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-0 placeholder:text-gray-400";

const selectTriggerClass =
  "rounded-xl border-0 bg-gray-100 h-12 px-4 text-sm text-gray-700 focus:ring-2 focus:ring-gold/40 focus:ring-offset-0";

const Booking = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get("service") || "";
  const promoCodeParam = searchParams.get("promo") || "";

  const { data: salon, isLoading, isError, error } = useQuery({
    queryKey: ["salon-public", slug],
    queryFn: () => fetchPublicSalonBySlug(slug!),
    enabled: Boolean(slug),
  });

  const [selectedService, setSelectedService] = useState(preselectedService);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [paymentOption, setPaymentOption] = useState("pay-at-salon");
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<BookingCreated | null>(null);
  const [promoInfo, setPromoInfo] = useState<PromoCodeInfo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const technicians = salon?.technicians ?? [];

  useEffect(() => {
    if (!salon?.services?.length) return;
    const valid =
      preselectedService && salon.services.some((s) => s.id === preselectedService)
        ? preselectedService
        : "";
    if (valid) setSelectedService(valid);
  }, [salon, preselectedService]);

  useEffect(() => {
    if (!promoCodeParam || !salon) return;
    setPromoInfo(null);
    setPromoError(null);
    validatePromoCode(promoCodeParam, salon.id)
      .then((info) => setPromoInfo(info))
      .catch((err: unknown) => {
        const msg = err instanceof ApiError ? err.message : "Invalid promo code";
        setPromoError(msg);
      });
  }, [promoCodeParam, salon?.id]);

  const promoApplies =
    promoInfo &&
    (promoInfo.discountScope === "all_services" ||
      !selectedService ||
      (promoInfo.serviceIds ?? []).includes(selectedService));

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!salon) throw new Error("Salon missing");
      const start = combineLocalDateAndTime(date, time);
      if (start <= new Date()) throw new Error("Please choose a future date and time.");
      const notesExtra =
        paymentOption === "pay-now"
          ? "Payment: pay online (integration pending)."
          : "Payment: pay at salon.";
      return createGuestBooking({
        salonId: salon.id,
        serviceId: selectedService,
        startAt: start.toISOString(),
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        notes: notesExtra,
        ...(selectedTechnician ? { technicianId: selectedTechnician } : {}),
        ...(promoApplies && promoCodeParam ? { promoCode: promoCodeParam } : {}),
      });
    },
    onSuccess: (booking) => {
      setConfirmedBooking(booking);
      toast.success("Booking request sent.");
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Booking failed.";
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bookingMutation.mutate();
  };

  const todayMin = new Date().toISOString().slice(0, 10);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex justify-center gap-2 text-gray-400 py-24">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading booking…</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !salon) {
    const msg = error instanceof ApiError ? error.message : "Salon not found";
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 container text-center py-20">
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">{msg}</h1>
          <Link to="/salons">
            <Button variant="outline" className="mt-6 rounded-xl h-10 px-5 border-gray-200 text-gray-700 text-sm">
              Back to Salons
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const slugPath = salon.slug;
  const service = salon.services.find((s) => s.id === selectedService);
  const locationLine = [salon.address, salon.city, salon.country].filter(Boolean).join(" · ");
  const showTechStep = technicians.length > 0;
  const contactStep = showTechStep ? 4 : 3;
  const paymentStep = showTechStep ? 5 : 4;

  const preferredTechRow = confirmedBooking
    ? confirmedBooking.technician ??
      technicians.find((t) => t.id === confirmedBooking.technicianId) ??
      null
    : null;

  if (confirmedBooking) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 container max-w-lg text-center py-16 space-y-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
          </motion.div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Booking Received</h1>
            <p className="text-gray-500 leading-relaxed">
              Your request at <strong className="font-semibold text-gray-900">{salon.name}</strong> is pending confirmation.
            </p>
            <p className="text-xs text-gray-400">
              Reference <span className="font-mono text-gray-600">{confirmedBooking.id}</span>
            </p>
          </div>

          {/* Booking summary */}
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
                  {confirmedBooking?.discountPct ? (
                    <span className="text-right">
                      <span className="line-through text-gray-300 text-xs mr-2">
                        Rs. {(service.priceCents / 100).toLocaleString()}
                      </span>
                      <span className="font-semibold text-gold">
                        Rs. {Math.round(service.priceCents * (1 - confirmedBooking.discountPct / 100) / 100).toLocaleString()}
                      </span>
                    </span>
                  ) : (
                    <span className="font-semibold text-gray-900">
                      Rs. {(service.priceCents / 100).toLocaleString()}
                    </span>
                  )}
                </div>
                {confirmedBooking?.discountPct && (
                  <div className="flex justify-between text-sm py-2.5 border-b border-gray-100">
                    <span className="text-gray-400">Discount</span>
                    <span className="font-semibold text-gold">{confirmedBooking.discountPct}% off</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-sm py-2.5 border-b border-gray-100">
              <span className="text-gray-400">Starts</span>
              <span className="font-semibold text-gray-900">
                {new Date(confirmedBooking.startAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
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
            <div className="flex justify-between text-sm py-2.5">
              <span className="text-gray-400">Payment</span>
              <span className="font-semibold text-gray-900">
                {paymentOption === "pay-now" ? "Pay online" : "Pay at salon"}
              </span>
            </div>
          </div>

          <Link to="/">
            <Button className="rounded-full bg-gold hover:bg-gold/90 text-white px-8 h-12 font-semibold transition-all duration-200 hover:scale-105">
              Return to Home
            </Button>
          </Link>
        </div>
        <Footer />
      </motion.div>
    );
  }

  const StepCard = ({ num, title, children }: { num: number; title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/80 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-gold">{num}</span>
        </div>
        <h3 className="font-display font-semibold text-base tracking-tight text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-24">
        <div className="container max-w-2xl">
          <Link
            to={`/salon/${slugPath}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gold mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Salon
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-1">
              Book Appointment
            </h1>
            <p className="text-gray-500">{salon.name}</p>
            {locationLine && <p className="text-sm text-gray-400 mt-0.5">{locationLine}</p>}
            <span className="inline-block mt-2 text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">
              No account required
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Service */}
            <StepCard num={1} title="Select Service">
              {salon.services.length === 0 ? (
                <p className="text-sm text-gray-500">No bookable services yet. Please contact the salon.</p>
              ) : (
                <Select value={selectedService} onValueChange={setSelectedService} required>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-gray-100 shadow-elevated">
                    {salon.services.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-sm py-2.5">
                        {s.name} · {s.durationMin} min · Rs. {(s.priceCents / 100).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedService && service && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  {promoApplies ? (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400">
                        Selected · {service.durationMin} min
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="line-through text-gray-300 text-sm">
                          Rs. {(service.priceCents / 100).toLocaleString()}
                        </span>
                        <span className="font-bold text-gold text-sm">
                          Rs. {Math.round(service.priceCents * (1 - promoInfo!.discountPct / 100) / 100).toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          <Tag className="h-3 w-3" />{promoInfo!.discountPct}% off
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {service.name} · {service.durationMin} min · Rs. {(service.priceCents / 100).toLocaleString()}
                    </p>
                  )}
                </motion.div>
              )}

              {promoCodeParam && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  {promoInfo && promoApplies && (
                    <div className="flex items-center gap-2 bg-gold/8 border border-gold/20 rounded-xl px-4 py-3 text-sm">
                      <Tag className="h-4 w-4 text-gold shrink-0" />
                      <span className="font-semibold text-gold">{promoInfo.discountPct}% discount applied</span>
                      <span className="text-gray-400 text-xs ml-1">· {promoCodeParam}</span>
                    </div>
                  )}
                  {promoInfo && !promoApplies && selectedService && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-400">
                      Promo code does not apply to the selected service
                    </div>
                  )}
                  {promoError && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
                      {promoError}
                    </div>
                  )}
                </motion.div>
              )}
            </StepCard>

            {/* Step 2: Schedule */}
            {selectedService && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <StepCard num={2} title="Schedule">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 block">Date</label>
                      <Input
                        type="date"
                        min={todayMin}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 block">Time</label>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                </StepCard>
              </motion.div>
            )}

            {/* Step 3: Technician (optional) */}
            {selectedService && showTechStep && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <StepCard num={3} title="Preferred Technician">
                  <Select
                    value={selectedTechnician || "__any__"}
                    onValueChange={(v) => setSelectedTechnician(v === "__any__" ? "" : v)}
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Any available" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-gray-100 shadow-elevated">
                      <SelectItem value="__any__" className="text-sm py-2.5">Any available</SelectItem>
                      {technicians.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-sm py-2.5">
                          {t.name}{t.specialization ? ` · ${t.specialization}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </StepCard>
              </motion.div>
            )}

            {/* Step 4: Contact */}
            <StepCard num={contactStep} title="Your Contact">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 block">Full Name</label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 block">Phone</label>
                    <Input
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      required
                      autoComplete="tel"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 block">Email</label>
                    <Input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </StepCard>

            {/* Step 5: Payment */}
            <StepCard num={paymentStep} title="Payment Preference">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentOption("pay-at-salon")}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-150 ${
                    paymentOption === "pay-at-salon"
                      ? "border-gold bg-gold/5"
                      : "border-gray-100 hover:border-gray-200 bg-gray-50"
                  }`}
                >
                  <h4 className="font-semibold text-sm text-gray-900 mb-0.5">Pay at Salon</h4>
                  <p className="text-xs text-gray-500">Settle after your service.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption("pay-now")}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-150 ${
                    paymentOption === "pay-now"
                      ? "border-gold bg-gold/5"
                      : "border-gray-100 hover:border-gray-200 bg-gray-50"
                  }`}
                >
                  <h4 className="font-semibold text-sm text-gray-900 mb-0.5">Pay Online</h4>
                  <p className="text-xs text-gray-500">Integration can be added later.</p>
                </button>
              </div>
            </StepCard>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              disabled={
                bookingMutation.isPending ||
                !selectedService ||
                !date ||
                !time ||
                !guestName.trim() ||
                !guestPhone.trim() ||
                !guestEmail.trim()
              }
              className="w-full rounded-full bg-gold hover:bg-gold/90 text-white font-semibold text-base h-14 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 shadow-soft"
            >
              {bookingMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Submitting…
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </motion.div>
  );
};

export default Booking;
