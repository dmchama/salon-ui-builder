import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, Check, ArrowRight, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "Rs. 1,999",
    period: "/month",
    features: ["Up to 50 bookings/month", "Basic salon profile", "Email support", "1 staff member"],
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: "Rs. 4,999",
    period: "/month",
    features: ["Unlimited bookings", "Full salon profile with gallery", "Priority support", "Up to 5 staff", "Analytics dashboard"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Rs. 9,999",
    period: "/month",
    features: ["Everything in Professional", "Multiple branches", "Dedicated account manager", "Custom branding", "API access"],
    popular: false,
  },
];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("professional");

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setStep(2);
  };

  const handleComplete = () => {
    toast.success("Account created! Redirecting to dashboard...");
    navigate("/dashboard");
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
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full gap-2">
                  Next: Choose Plan <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full max-w-4xl px-4">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold">Choose Your Plan</h2>
              <p className="text-sm text-muted-foreground mt-1">Step 2 of 2 — Select a subscription plan</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all relative ${
                    selectedPlan === plan.id
                      ? "ring-2 ring-primary shadow-elevated"
                      : "hover:shadow-soft"
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">Most Popular</Badge>
                  )}
                  <CardContent className="p-6 pt-8">
                    <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                    <div className="mt-2 mb-4">
                      <span className="text-2xl font-bold font-display">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {selectedPlan === plan.id && (
                      <Badge variant="secondary" className="mt-4 w-full justify-center">Selected</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleComplete} className="gap-2">
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
