import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
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

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center min-h-screen">
        {step === 1 ? (
          <Card className="w-full max-w-md shadow-elevated">
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scissors className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="font-display text-2xl">Create Your Account</CardTitle>
              <p className="text-sm text-muted-foreground">Step 1 of 2 — Account Details</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full gap-2">
                  Next: Choose Plan <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign In
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full max-w-4xl px-4">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold">Choose Your Plan</h2>
              <p className="text-sm text-muted-foreground mt-1">Step 2 of 2 — Select a subscription plan</p>
            </div>

            {plansLoading && (
              <div className="flex justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading plans…
              </div>
            )}

            {plansError && (
              <p className="text-center text-destructive text-sm py-8">
                Could not load plans. Is the API running?
              </p>
            )}

            {!plansLoading && !plansError && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const features = featureList(plan.features);
                  const isSelected = selectedPlanId === plan.id;
                  const professional = plan.name.toLowerCase() === "professional";
                  return (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer transition-all relative ${
                        isSelected ? "ring-2 ring-primary shadow-elevated" : "hover:shadow-soft"
                      }`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      {professional && (
                        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">Popular</Badge>
                      )}
                      <CardContent className="p-6 pt-8">
                        <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                        <div className="mt-2 mb-4">
                          <span className="text-2xl font-bold font-display">
                            {formatMoney(plan.priceCents, plan.currency)}
                          </span>
                          <span className="text-sm text-muted-foreground"> / month</span>
                        </div>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                        )}
                        <ul className="space-y-2">
                          {features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        {isSelected && (
                          <Badge variant="secondary" className="mt-4 w-full justify-center">
                            Selected
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-2"
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleComplete} className="gap-2" disabled={submitting || plansLoading || !selectedPlanId}>
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
