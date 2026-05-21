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
import { ArrowLeft, CheckCircle, GitBranch, Loader2, MapPin, Tag } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchPublicSalonBySlug, fetchSalonBranches } from "@/api/salon-api";
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

const inputErrorClass =
  "rounded-xl border border-red-300 bg-red-50 h-12 px-4 text-sm text-gray-900 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-0 placeholder:text-gray-400";

const selectTriggerClass =
  "rounded-xl border-0 bg-gray-100 h-12 px-4 text-sm text-gray-700 focus:ring-2 focus:ring-gold/40 focus:ring-offset-0";

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

function validatePhone(v: string) {
  return /^[+\d][\d\s\-()]{6,19}$/.test(v.trim());
}
function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function validateName(v: string) {
  return v.trim().length >= 2;
}

const Booking = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get("service") || "";
  const promoCodeParam = searchParams.get("promo") || "";

  const [selectedBranchSlug, setSelectedBranchSlug] = useState(slug ?? "");

  const { data: branches = [] } = useQuery({
    queryKey: ["salon-branches", slug],
    queryFn: () => fetchSalonBranches(slug!),
    enabled: Boolean(slug),
  });

  const { data: salon, isLoading, isError, error } = useQuery({
    queryKey: ["salon-public", selectedBranchSlug],
    queryFn: () => fetchPublicSalonBySlug(selectedBranchSlug),
    enabled: Boolean(selectedBranchSlug),
  });

  const showBranchStep = branches.length > 1;

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
  const [manualPromoInput, setManualPromoInput] = useState(promoCodeParam);
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [touched, setTouched] = useState({ name: false, phone: false, email: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const technicians = salon?.technicians ?? [];

  useEffect(() => {
    if (!salon?.services?.length) return;
    const valid =
      preselectedService && salon.services.some((s) => s.id === preselectedService)
        ? preselectedService
        : "";
    setSelectedService(valid);
    setSelectedTechnician("");
  }, [salon, preselectedService]);

  useEffect(() => {
    if (!promoCodeParam || !salon) return;
    setManualPromoInput(promoCodeParam);
    setPromoInfo(null);
    setPromoError(null);
    validatePromoCode(promoCodeParam, salon.id)
      .then((info) => { setPromoInfo(info); setAppliedPromoCode(promoCodeParam); })
      .catch((err: unknown) => {
        const msg = err instanceof ApiError ? err.message : "Invalid promo code";
        setPromoError(msg);
      });
  }, [promoCodeParam, salon?.id]);

  const handleApplyPromo = async () => {
    const code = manualPromoInput.trim().toUpperCase();
    if (!code || !salon) return;
    setIsValidatingPromo(true);
    setPromoInfo(null);
    setPromoError(null);
    setAppliedPromoCode("");
    try {
      const info = await validatePromoCode(code, salon.id, selectedService || undefined);
      setPromoInfo(info);
      setAppliedPromoCode(code);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Invalid promo code";
      setPromoError(msg);
    } finally {
      setIsValidatingPromo(false);
    }
  };

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
        ...(promoApplies && appliedPromoCode ? { promoCode: appliedPromoCode } : {}),
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

  const nameError = (touched.name || submitAttempted) && !validateName(guestName) ? "Please enter your full name" : null;
  const phoneError = (touched.phone || submitAttempted) && !validatePhone(guestPhone) ? "Enter a valid phone number (e.g. +94 77 123 4567)" : null;
  const emailError = (touched.email || submitAttempted) && !validateEmail(guestEmail) ? "Enter a valid email address" : null;
  const contactValid = validateName(guestName) && validatePhone(guestPhone) && validateEmail(guestEmail);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!contactValid) return;
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
  const offset = showBranchStep ? 1 : 0;
  const serviceStep = 1 + offset;
  const scheduleStep = 2 + offset;
  const techStep = 3 + offset;
  const contactStep = (showTechStep ? 4 : 3) + offset;
  const paymentStep = (showTechStep ? 5 : 4) + offset;

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
            <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Booking Confirmed!</h1>
            <p className="text-gray-500 leading-relaxed">
              Your appointment at <strong className="font-semibold text-gray-900">{salon.name}</strong> is confirmed.
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
            <div className={`flex justify-between text-sm py-2.5 ${salon.contactPhone ? "border-b border-gray-100" : ""}`}>
              <span className="text-gray-400">Payment</span>
              <span className="font-semibold text-gray-900">
                {paymentOption === "pay-now" ? "Pay online" : "Pay at salon"}
              </span>
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
        <Footer />
      </motion.div>
    );
  }


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
            {/* Step 1 (optional): Select Branch */}
            {showBranchStep && (
              <StepCard num={1} title="Select Branch">
                <div className="grid grid-cols-1 gap-3">
                  {branches.map((branch) => {
                    const branchLocation = [branch.city, branch.country].filter(Boolean).join(", ");
                    const isSelected = branch.slug === selectedBranchSlug;
                    return (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => setSelectedBranchSlug(branch.slug)}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                          isSelected
                            ? "border-gold bg-gold/5"
                            : "border-gray-100 hover:border-gray-200 bg-gray-50"
                        }`}
                      >
                        <span className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-gold/10" : "bg-gray-200"}`}>
                          <GitBranch className={`h-3.5 w-3.5 ${isSelected ? "text-gold" : "text-gray-400"}`} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold text-sm text-gray-900">{branch.name}</span>
                          {branchLocation && (
                            <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {branchLocation}
                            </span>
                          )}
                        </span>
                        {isSelected && (
                          <span className="shrink-0 mt-0.5 text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </StepCard>
            )}

            {/* Service step */}
            <StepCard num={serviceStep} title="Select Service">
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

            </StepCard>

            {/* Promo code */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/80 space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <Tag className="h-3.5 w-3.5 text-gold" />
                </div>
                <h3 className="font-display font-semibold text-base tracking-tight text-gray-900">Promo Code</h3>
              </div>
              <div className="flex gap-2">
                <Input
                  value={manualPromoInput}
                  onChange={(e) => {
                    setManualPromoInput(e.target.value.toUpperCase());
                    setPromoInfo(null);
                    setPromoError(null);
                    setAppliedPromoCode("");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyPromo(); } }}
                  placeholder="Enter promo code"
                  className="rounded-xl border-0 bg-gray-100 h-11 px-4 text-sm font-mono tracking-wider uppercase text-gray-900 focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-0 placeholder:text-gray-400 flex-1 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                />
                <Button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={!manualPromoInput.trim() || isValidatingPromo}
                  className="rounded-xl h-11 px-5 text-sm font-semibold bg-gold/10 text-gold hover:bg-gold/20 border-0 shadow-none shrink-0 disabled:opacity-40"
                >
                  {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
              {promoInfo && promoApplies && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-gold/8 border border-gold/20 rounded-xl px-4 py-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-gold shrink-0" />
                  <span className="font-semibold text-gold">{promoInfo.discountPct}% discount applied</span>
                  <span className="text-gray-400 text-xs ml-auto font-mono">{appliedPromoCode}</span>
                </motion.div>
              )}
              {promoInfo && !promoApplies && selectedService && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                  This promo code does not apply to the selected service.
                </div>
              )}
              {promoError && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
                  {promoError}
                </motion.div>
              )}
            </div>

            {/* Schedule step */}
            {selectedService && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <StepCard num={scheduleStep} title="Schedule">
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

            {/* Technician step (optional) */}
            {selectedService && showTechStep && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <StepCard num={techStep} title="Preferred Technician">
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

            {/* Contact step */}
            <StepCard num={contactStep} title="Your Contact">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 block">Full Name</label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className={nameError ? inputErrorClass : inputClass}
                  />
                  {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 block">Phone</label>
                    <Input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      placeholder="+94 77 123 4567"
                      autoComplete="tel"
                      className={phoneError ? inputErrorClass : inputClass}
                    />
                    {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 block">Email</label>
                    <Input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={emailError ? inputErrorClass : inputClass}
                    />
                    {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
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
            {bookingMutation.isError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {bookingMutation.error instanceof Error
                  ? bookingMutation.error.message
                  : "Booking failed. Please try again."}
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={
                bookingMutation.isPending ||
                !selectedService ||
                !date ||
                !time ||
                !contactValid
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
