import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scissors, Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { toast } from "sonner";
import { fetchSubscriptionPlans } from "@/api/plans-api";
import { registerSalonAdmin } from "@/api/auth-api";
import { setAuth } from "@/lib/auth-storage";
import { ApiError } from "@/api/http";

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const { data: plans = [], isLoading: plansLoading, isError: plansError } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: fetchSubscriptionPlans,
    enabled: step === 2,
  });

  useEffect(() => {
    if (plans.length === 0) return;
    setSelectedPlanId((prev) => (prev && plans.some((p) => p.id === prev) ? prev : plans[0].id));
  }, [plans]);

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setStep(2);
  };

  const handleComplete = async () => {
    if (!selectedPlanId) {
      toast.error("Select a subscription plan.");
      return;
    }
    const trimmed = fullName.trim();
    const parts = trimmed.split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;

    setSubmitting(true);
    try {
      const { accessToken, user } = await registerSalonAdmin({
        email: email.trim(),
        password,
        role: "SALON_ADMIN",
        firstName: firstName || undefined,
        lastName,
        subscriptionPlanId: selectedPlanId,
      });
      setAuth(accessToken, user);
      toast.success("Account created! Set up your salon in the dashboard.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Registration failed.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (cents: number, currency: string) => {
    const major = cents / 100;
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency === "LKR" ? "LKR" : "USD",
      maximumFractionDigits: 0,
    }).format(major);
  };

  const featureList = (raw: unknown): string[] => {
    if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) return raw as string[];
    return [];
  };

  const inputClass =
    "rounded-xl border-0 bg-gray-100 h-12 px-4 text-sm text-gray-900 focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-0 placeholder:text-gray-400";

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="List Your Salon on SaloonBooking"
        description="Register your salon or saloon on SaloonBooking.lk and start accepting bookings online in Sri Lanka."
        path="/register"
        noindex
      />
      <Navbar />
      <div className="pt-20 min-h-screen flex items-center justify-center px-4 py-12">
        {step === 1 ? (
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-3xl shadow-elevated p-8 space-y-7">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto shadow-soft">
                  <Scissors className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">
                    Create Account
                  </h1>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="w-6 h-1.5 rounded-full bg-gold" />
                    <div className="w-6 h-1.5 rounded-full bg-gray-200" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Step 1 of 2 — Account Details</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 tracking-wide block">Full Name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" required className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 tracking-wide block">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 tracking-wide block">Password</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} autoComplete="new-password" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 tracking-wide block">Confirm Password</label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required autoComplete="new-password" className={inputClass} />
                </div>
                <Button type="submit" className="w-full rounded-xl h-12 bg-gold hover:bg-gold/90 text-white font-semibold text-sm transition-all duration-200 gap-2 mt-1">
                  Next: Choose Plan <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <p className="text-sm text-gray-500 text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-gold font-semibold hover:underline underline-offset-2">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl px-4">
            {/* Header */}
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900">Choose Your Plan</h2>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="w-6 h-1.5 rounded-full bg-gold/40" />
                <div className="w-6 h-1.5 rounded-full bg-gold" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Step 2 of 2 — Select a subscription plan</p>
            </div>

            {plansLoading && (
              <div className="flex justify-center py-16 gap-2 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading plans…</span>
              </div>
            )}

            {plansError && (
              <p className="text-center text-destructive text-sm py-8">
                Could not load plans. Is the API running?
              </p>
            )}

            {!plansLoading && !plansError && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {plans.map((plan) => {
                  const features = featureList(plan.features);
                  const isSelected = selectedPlanId === plan.id;
                  const professional = plan.name.toLowerCase() === "professional";
                  return (
                    <div
                      key={plan.id}
                      className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "ring-2 ring-gold shadow-elevated scale-[1.02]"
                          : "shadow-soft hover:shadow-elevated hover:-translate-y-1"
                      }`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      {professional && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white rounded-full px-3 text-[10px] font-semibold border-none">
                          Popular
                        </Badge>
                      )}
                      <div className="pt-2">
                        <h3 className="font-display text-lg font-bold tracking-tight text-gray-900">{plan.name}</h3>
                        <div className="mt-2 mb-4">
                          <span className="text-3xl font-bold text-gray-900">
                            {formatMoney(plan.priceCents, plan.currency)}
                          </span>
                          <span className="text-sm text-gray-400 ml-1">/ month</span>
                        </div>
                        {plan.description && (
                          <p className="text-sm text-gray-500 mb-5 leading-relaxed">{plan.description}</p>
                        )}
                        <ul className="space-y-2.5">
                          {features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                              <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        {isSelected && (
                          <div className="mt-5 flex items-center justify-center gap-2 text-gold text-sm font-semibold">
                            <Check className="h-4 w-4" /> Selected
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-2 rounded-xl h-11 px-5 border-gray-200 text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleComplete}
                className="gap-2 rounded-xl h-11 px-6 bg-gold hover:bg-gold/90 text-white font-semibold"
                disabled={submitting || plansLoading || !selectedPlanId}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create Account <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
