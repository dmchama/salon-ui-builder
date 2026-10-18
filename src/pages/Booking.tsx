import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import BookingLayout, { type WizardStep } from "@/components/booking/BookingLayout";
import BookingSummary from "@/components/booking/BookingSummary";
import ServicesStep from "@/components/booking/ServicesStep";
import ProfessionalStep from "@/components/booking/ProfessionalStep";
import TimeStep from "@/components/booking/TimeStep";
import ConfirmStep, { type ContactValues } from "@/components/booking/ConfirmStep";
import BookingSuccess from "@/components/booking/BookingSuccess";
import { fetchPublicSalonBySlug, fetchSalonBranches } from "@/api/salon-api";
import { availabilityQueryKey, createGuestBooking, validatePromoCode, type BookingCreated, type PromoCodeInfo } from "@/api/bookings-api";
import { ApiError } from "@/api/http";
import { toStartAtIso } from "@/lib/booking-slots";
import { validateEmail, validateName, validatePhone } from "@/lib/booking-format";
import { toast } from "sonner";

type StepKey = "services" | "professional" | "time" | "confirm";

const STEP_TITLES: Record<StepKey, string> = {
  services: "Select a service",
  professional: "Select a professional",
  time: "Select date and time",
  confirm: "Review and confirm",
};

/** Booking errors that mean "pick another time" (AC17). */
const RETRY_TIME_CODES = ["SLOT_TAKEN", "OUTSIDE_BUSINESS_HOURS", "PAST_START"];

const Booking = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const [step, setStep] = useState<StepKey>("services");
  const [selectedService, setSelectedService] = useState(preselectedService);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [contact, setContact] = useState<ContactValues>({ name: "", phone: "", email: "" });
  const [touched, setTouched] = useState({ name: false, phone: false, email: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [paymentOption, setPaymentOption] = useState("pay-at-salon");
  const [confirmedBooking, setConfirmedBooking] = useState<BookingCreated | null>(null);
  const [promoInfo, setPromoInfo] = useState<PromoCodeInfo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [manualPromoInput, setManualPromoInput] = useState(promoCodeParam);
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const openedFromServiceLink = useRef(false);

  const technicians = salon?.technicians ?? [];
  const hasTechnicians = technicians.length > 0;

  // Reset the selection when the salon (branch) changes.
  useEffect(() => {
    if (!salon?.services?.length) return;
    const valid =
      preselectedService && salon.services.some((s) => s.id === preselectedService) ? preselectedService : "";
    setSelectedService(valid);
    setSelectedTechnician("");
    setDate("");
    setTime("");
    // A ?service= link skips the Services screen once.
    if (valid && !openedFromServiceLink.current) {
      openedFromServiceLink.current = true;
      setStep((salon.technicians ?? []).length > 0 ? "professional" : "time");
    }
  }, [salon, preselectedService]);

  useEffect(() => {
    if (!promoCodeParam || !salon) return;
    setManualPromoInput(promoCodeParam);
    setPromoInfo(null);
    setPromoError(null);
    validatePromoCode(promoCodeParam, salon.id)
      .then((info) => {
        setPromoInfo(info);
        setAppliedPromoCode(promoCodeParam);
      })
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

  const promoApplies = Boolean(
    promoInfo &&
      (promoInfo.discountScope === "all_services" ||
        !selectedService ||
        (promoInfo.serviceIds ?? []).includes(selectedService)),
  );

  const handleDateChange = useCallback((next: string) => {
    setDate((prev) => {
      if (prev !== next) setTime("");
      return next;
    });
  }, []);

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!salon) throw new Error("Salon missing");
      return createGuestBooking({
        salonId: salon.id,
        serviceId: selectedService,
        startAt: toStartAtIso(date, time),
        guestName: contact.name.trim(),
        guestEmail: contact.email.trim(),
        guestPhone: contact.phone.trim(),
        notes: paymentOption === "pay-now" ? "Payment: pay online (integration pending)." : "Payment: pay at salon.",
        ...(selectedTechnician ? { technicianId: selectedTechnician } : {}),
        ...(promoApplies && appliedPromoCode ? { promoCode: appliedPromoCode } : {}),
      });
    },
    onSuccess: (booking) => {
      setConfirmedBooking(booking);
      toast.success("Booking confirmed.");
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.code && RETRY_TIME_CODES.includes(err.code) && salon) {
        toast.error(
          err.code === "SLOT_TAKEN"
            ? "Sorry, that time was just taken. Please pick another time."
            : "That time is no longer available. Please pick another time.",
        );
        queryClient.invalidateQueries({ queryKey: availabilityQueryKey(salon.id, selectedService) });
        setTime("");
        setStep("time");
        bookingMutation.reset();
        return;
      }
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Booking failed.";
      toast.error(msg);
    },
  });

  const contactValid = validateName(contact.name) && validatePhone(contact.phone) && validateEmail(contact.email);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Seo title="Loading…" description="Loading booking." path={`/booking/${slug ?? ""}`} noindex />
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
        <Seo title="Salon Not Found" description="This salon could not be found." path={`/booking/${slug ?? ""}`} noindex />
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

  const service = salon.services.find((s) => s.id === selectedService);
  const locationLine = [salon.address, salon.city, salon.country].filter(Boolean).join(" · ");

  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-background">
        <Seo title="Booking Confirmed" description="Your booking is confirmed." path={`/booking/${slug ?? ""}`} noindex />
        <Navbar />
        <BookingSuccess
          booking={confirmedBooking}
          salon={salon}
          service={service}
          technicians={technicians}
          paymentOption={paymentOption}
        />
        <Footer />
      </div>
    );
  }

  const steps: WizardStep[] = [
    { key: "services", label: "Services" },
    ...(hasTechnicians ? [{ key: "professional", label: "Professional" }] : []),
    { key: "time", label: "Time" },
    { key: "confirm", label: "Confirm" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);
  const goTo = (key: string) => setStep(key as StepKey);
  const nextStep = () => goTo(steps[Math.min(stepIndex + 1, steps.length - 1)].key);
  const closeBooking = () => navigate(`/salon/${salon.slug}`);
  const back = () => (stepIndex > 0 ? goTo(steps[stepIndex - 1].key) : closeBooking());

  const continueDisabled =
    step === "services" ? !service : step === "time" ? !date || !time : step === "confirm" ? bookingMutation.isPending : false;

  const handleContinue = () => {
    if (step !== "confirm") return nextStep();
    setSubmitAttempted(true);
    if (!contactValid) return;
    bookingMutation.mutate();
  };

  return (
    <div className="min-h-screen">
      <Seo
        title={`Book ${salon.name}`}
        description={`Book your appointment at ${salon.name}${locationLine ? ` in ${locationLine}` : ""}.`}
        path={`/booking/${salon.slug}`}
        noindex
      />
      <BookingLayout
        steps={steps}
        currentKey={step}
        onStepClick={goTo}
        onBack={back}
        onClose={closeBooking}
        title={STEP_TITLES[step]}
        summary={
          <BookingSummary
            salon={salon}
            service={service}
            professionalName={technicians.find((t) => t.id === selectedTechnician)?.name}
            discountPct={promoApplies ? promoInfo?.discountPct : undefined}
            date={date}
            time={time}
            continueLabel={step === "confirm" ? "Confirm booking" : "Continue"}
            continueDisabled={continueDisabled}
            loading={bookingMutation.isPending}
            onContinue={handleContinue}
          />
        }
      >
        {step === "services" && (
          <ServicesStep
            branches={branches}
            selectedBranchSlug={selectedBranchSlug}
            onBranchChange={setSelectedBranchSlug}
            services={salon.services}
            selectedService={selectedService}
            onServiceChange={(id) => {
              setSelectedService(id);
              setTime("");
            }}
            promoInput={manualPromoInput}
            onPromoInputChange={(value) => {
              setManualPromoInput(value);
              setPromoInfo(null);
              setPromoError(null);
              setAppliedPromoCode("");
            }}
            onApplyPromo={handleApplyPromo}
            isValidatingPromo={isValidatingPromo}
            promoInfo={promoInfo}
            promoApplies={promoApplies}
            appliedPromoCode={appliedPromoCode}
            promoError={promoError}
          />
        )}
        {step === "professional" && (
          <ProfessionalStep technicians={technicians} selected={selectedTechnician} onSelect={setSelectedTechnician} />
        )}
        {step === "time" && service && (
          <TimeStep
            salonId={salon.id}
            serviceId={service.id}
            salonPhone={salon.contactPhone}
            technicians={technicians}
            technicianId={selectedTechnician}
            onTechnicianChange={setSelectedTechnician}
            date={date}
            time={time}
            onDateChange={handleDateChange}
            onTimeChange={setTime}
          />
        )}
        {step === "confirm" && (
          <ConfirmStep
            values={contact}
            onChange={setContact}
            touched={touched}
            onBlur={(f) => setTouched((t) => ({ ...t, [f]: true }))}
            showAllErrors={submitAttempted}
            paymentOption={paymentOption}
            onPaymentChange={setPaymentOption}
            error={bookingMutation.isError && bookingMutation.error instanceof Error ? bookingMutation.error.message : null}
          />
        )}
      </BookingLayout>
    </div>
  );
};

export default Booking;
