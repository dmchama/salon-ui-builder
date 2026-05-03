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
      if (start <= new Date()) {
        throw new Error("Please choose a future date and time.");
      }
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
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 flex justify-center gap-2 text-black/50 py-24">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="uppercase tracking-widest text-sm">Loading booking…</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !salon) {
    const msg = error instanceof ApiError ? error.message : "Salon not found";
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 container text-center py-20">
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-black">{msg}</h1>
          <Link to="/salons">
            <Button variant="outline" className="mt-6 rounded-none uppercase tracking-widest text-xs">
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 container max-w-2xl text-center py-24 space-y-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <CheckCircle className="h-20 w-20 text-gold mx-auto" />
          </motion.div>
          <div className="space-y-4">
            <h1 className="font-display text-4xl font-bold uppercase tracking-widest text-black">Booking Received</h1>
            <p className="text-black/60 font-light tracking-wide text-lg">
              Your request at <strong className="font-bold text-black">{salon.name}</strong> is pending confirmation.
            </p>
            <p className="text-xs text-black/40 uppercase tracking-widest">
              Reference <span className="font-mono text-black/70">{confirmedBooking.id}</span>
            </p>
          </div>

          <div className="border border-black/10 p-8 text-left max-w-md mx-auto space-y-4">
            {locationLine && (
              <div className="flex justify-between text-sm py-2 border-b border-black/5 gap-4">
                <span className="text-black/60 uppercase tracking-widest shrink-0">Location</span>
                <span className="font-bold tracking-widest text-right">{locationLine}</span>
              </div>
            )}
            <div className="flex justify-between text-sm py-2 border-b border-black/5">
              <span className="text-black/60 uppercase tracking-widest">Service</span>
              <span className="font-bold tracking-widest">{service?.name}</span>
            </div>
            {service && (
              <>
                <div className="flex justify-between text-sm py-2 border-b border-black/5">
                  <span className="text-black/60 uppercase tracking-widest">Duration</span>
                  <span className="font-bold tracking-widest">{service.durationMin} min</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-black/5">
                  <span className="text-black/60 uppercase tracking-widest">Price</span>
                  {confirmedBooking?.discountPct ? (
                    <span className="text-right">
                      <span className="line-through text-black/30 text-xs mr-2">Rs. {(service.priceCents / 100).toLocaleString()}</span>
                      <span className="font-bold tracking-widest text-gold">
                        Rs. {Math.round(service.priceCents * (1 - confirmedBooking.discountPct / 100) / 100).toLocaleString()}
                      </span>
                    </span>
                  ) : (
                    <span className="font-bold tracking-widest">
                      Rs. {(service.priceCents / 100).toLocaleString()}
                    </span>
                  )}
                </div>
                {confirmedBooking?.discountPct && (
                  <div className="flex justify-between text-sm py-2 border-b border-black/5">
                    <span className="text-black/60 uppercase tracking-widest">Discount</span>
                    <span className="font-bold tracking-widest text-gold">{confirmedBooking.discountPct}% off</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-sm py-2 border-b border-black/5">
              <span className="text-black/60 uppercase tracking-widest">Starts</span>
              <span className="font-bold tracking-widest">
                {new Date(confirmedBooking.startAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
            {preferredTechRow && (
              <div className="flex justify-between text-sm py-2 border-b border-black/5 gap-4">
                <span className="text-black/60 uppercase tracking-widest shrink-0">Technician</span>
                <span className="font-bold tracking-widest text-right">
                  {preferredTechRow.name}
                  {preferredTechRow.specialization ? ` · ${preferredTechRow.specialization}` : ""}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm py-2">
              <span className="text-black/60 uppercase tracking-widest">Payment</span>
              <span className="font-bold tracking-widest">
                {paymentOption === "pay-now" ? "Pay online (follow-up)" : "Pay at salon"}
              </span>
            </div>
          </div>
          <Link to="/">
            <Button className="rounded-none bg-black hover:bg-gold text-white uppercase tracking-widest px-8 py-6">
              Return to Home
            </Button>
          </Link>
        </div>
        <Footer />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-32 pb-24">
        <div className="container max-w-3xl">
          <Link
            to={`/salon/${slugPath}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/50 hover:text-gold mb-10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Link>

          <div className="mb-12 border-b border-black/10 pb-8">
            <h1 className="font-display text-4xl font-bold uppercase tracking-widest text-black mb-2">Book Appointment</h1>
            <p className="font-light tracking-wide text-black/60">{salon.name}</p>
            {locationLine && (
              <p className="text-sm text-black/50 mt-2 tracking-wide">{locationLine}</p>
            )}
            <p className="text-xs text-black/40 mt-2 uppercase tracking-widest">No account required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-16">
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black">1. Select Service</h3>
              {salon.services.length === 0 ? (
                <p className="text-sm text-black/60">No bookable services yet. Please contact the salon.</p>
              ) : (
                <Select value={selectedService} onValueChange={setSelectedService} required>
                  <SelectTrigger className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus:ring-0 text-sm tracking-widest uppercase py-6 bg-transparent h-auto">
                    <SelectValue placeholder="CHOOSE A SERVICE" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-black/10">
                    {salon.services.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="uppercase tracking-widest text-xs py-3">
                        {s.name} · {s.durationMin} min · Rs. {(s.priceCents / 100).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedService && service && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 border border-black/5 p-6"
              >
                {promoApplies ? (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-black/50">
                      Selected · {service.durationMin} min
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="line-through text-black/30 text-sm">Rs. {(service.priceCents / 100).toLocaleString()}</span>
                      <span className="font-bold text-gold text-sm">
                        Rs. {Math.round(service.priceCents * (1 - promoInfo!.discountPct / 100) / 100).toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-xs font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest">
                        <Tag className="h-3 w-3" />{promoInfo!.discountPct}% off
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs uppercase tracking-widest text-black/50">
                    Selected · {service.durationMin} min · Rs. {(service.priceCents / 100).toLocaleString()}
                  </p>
                )}
              </motion.div>
            )}

            {promoCodeParam && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {promoInfo && promoApplies && (
                  <div className="flex items-center gap-2 border border-gold/30 bg-gold/5 px-4 py-3 text-sm">
                    <Tag className="h-4 w-4 text-gold shrink-0" />
                    <span className="font-bold text-gold uppercase tracking-widest">{promoInfo.discountPct}% discount applied</span>
                    <span className="text-black/40 text-xs ml-1">· code {promoCodeParam}</span>
                  </div>
                )}
                {promoInfo && !promoApplies && selectedService && (
                  <div className="border border-black/10 bg-black/2 px-4 py-3 text-xs text-black/50 uppercase tracking-widest">
                    Promo code does not apply to the selected service
                  </div>
                )}
                {promoError && (
                  <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 uppercase tracking-widest">
                    {promoError}
                  </div>
                )}
              </motion.div>
            )}

            {selectedService && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black">2. Schedule</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/50">Date</label>
                    <Input
                      type="date"
                      min={todayMin}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus-visible:ring-0 focus-visible:border-gold py-6 text-black tracking-widest uppercase bg-transparent h-auto"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/50">Time</label>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus-visible:ring-0 focus-visible:border-gold py-6 text-black tracking-widest uppercase bg-transparent h-auto"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {selectedService && showTechStep && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black">
                  3. Preferred technician <span className="text-black/40 font-normal">(optional)</span>
                </h3>
                <Select
                  value={selectedTechnician || "__any__"}
                  onValueChange={(v) => setSelectedTechnician(v === "__any__" ? "" : v)}
                >
                  <SelectTrigger className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus:ring-0 text-sm tracking-widest uppercase py-6 bg-transparent h-auto">
                    <SelectValue placeholder="ANY AVAILABLE" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-black/10">
                    <SelectItem value="__any__" className="uppercase tracking-widest text-xs py-3">
                      Any available
                    </SelectItem>
                    {technicians.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="uppercase tracking-widest text-xs py-3">
                        {t.name}
                        {t.specialization ? ` · ${t.specialization}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black">
                {contactStep}. Your contact
              </h3>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/50">Full Name</label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    autoComplete="name"
                    className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus-visible:ring-0 focus-visible:border-gold py-6 text-black tracking-widest bg-transparent h-auto placeholder:text-black/20"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/50">Phone</label>
                    <Input
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      required
                      autoComplete="tel"
                      className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus-visible:ring-0 focus-visible:border-gold py-6 text-black tracking-widest bg-transparent h-auto placeholder:text-black/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/50">Email</label>
                    <Input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus-visible:ring-0 focus-visible:border-gold py-6 text-black tracking-widest bg-transparent h-auto placeholder:text-black/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black">
                {paymentStep}. Payment preference
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentOption("pay-at-salon")}
                  className={`p-6 border cursor-pointer transition-colors ${paymentOption === "pay-at-salon" ? "border-gold bg-gold/5" : "border-black/5 hover:border-black/20"}`}
                >
                  <h4 className="font-bold uppercase tracking-widest mb-1">Pay at Salon</h4>
                  <p className="text-xs font-light text-black/60 tracking-wider">Settle after your service.</p>
                </div>
                <div
                  onClick={() => setPaymentOption("pay-now")}
                  className={`p-6 border cursor-pointer transition-colors ${paymentOption === "pay-now" ? "border-gold bg-gold/5" : "border-black/5 hover:border-black/20"}`}
                >
                  <h4 className="font-bold uppercase tracking-widest mb-1">Pay Online</h4>
                  <p className="text-xs font-light text-black/60 tracking-wider">Integration can be added later.</p>
                </div>
              </div>
            </div>

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
              className="w-full rounded-none bg-black hover:bg-gold text-white uppercase tracking-widest font-bold py-8 text-lg hover:-translate-y-1 transition-transform"
            >
              {bookingMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Submitting…
                </>
              ) : (
                "Confirm booking"
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
