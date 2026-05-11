import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchSubscriptionPlans, SubscriptionPlanDto } from "@/api/plans-api";

function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return "Free";
  const major = cents / 100;
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: currency === "LKR" ? "LKR" : currency,
    maximumFractionDigits: 0,
  }).format(major);
}

function yearlyPrice(cents: number, currency: string): string {
  if (cents === 0) return "Free";
  return formatPrice(Math.round(cents * 12 * 0.8), currency);
}

function intervalSuffix(months: number): string {
  if (months === 1) return "/month";
  if (months === 12) return "/year";
  return `/${months} months`;
}

function featureList(raw: unknown): string[] {
  if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) return raw as string[];
  return [];
}

const PlanCard = ({
  plan,
  isPopular,
  isYearly,
  index,
}: {
  plan: SubscriptionPlanDto;
  isPopular: boolean;
  isYearly: boolean;
  index: number;
}) => {
  const features = featureList(plan.features);
  const displayPrice = isYearly
    ? yearlyPrice(plan.priceCents, plan.currency)
    : formatPrice(plan.priceCents, plan.currency);
  const period =
    plan.priceCents === 0 ? "" : isYearly ? "/year" : intervalSuffix(plan.intervalMonths);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`relative h-full flex flex-col rounded-2xl p-8 ${
        isPopular
          ? "bg-zinc-900 text-white shadow-float ring-1 ring-white/10"
          : "bg-white text-gray-900 shadow-soft border border-gray-100"
      }`}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="bg-gold text-white text-[10px] px-4 py-1 font-semibold rounded-full shadow-sm">
            Most Popular
          </div>
        </div>
      )}

      <div className="mb-8 pb-8 border-b border-current/10">
        <h3 className="font-display text-xl font-bold tracking-tight mb-2">{plan.name}</h3>
        {plan.description && (
          <p className={`text-sm leading-relaxed ${isPopular ? "text-white/60" : "text-gray-500"}`}>
            {plan.description}
          </p>
        )}
        <div className="mt-8 flex items-baseline gap-1.5 h-10">
          <AnimatePresence mode="wait">
            <motion.span
              key={displayPrice}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="font-display text-4xl font-bold tracking-tight"
            >
              {displayPrice}
            </motion.span>
          </AnimatePresence>
          <span className={`text-sm ${isPopular ? "text-white/45" : "text-gray-400"}`}>{period}</span>
        </div>
        {isYearly && plan.priceCents > 0 && (
          <p className={`text-xs mt-2 ${isPopular ? "text-white/45" : "text-gray-400"}`}>
            Save 20% vs monthly billing
          </p>
        )}
      </div>

      <ul className="space-y-3.5 flex-1 mb-8">
        {features.map((f) => (
          <li key={f} className={`flex items-start gap-3 text-sm ${isPopular ? "text-white/85" : "text-gray-700"}`}>
            <Check className="h-4 w-4 shrink-0 mt-0.5 text-gold" />
            <span>{f}</span>
          </li>
        ))}
        {features.length === 0 && (
          <li className={`text-sm ${isPopular ? "text-white/45" : "text-gray-400"}`}>
            Contact us for details
          </li>
        )}
      </ul>

      <Link to="/register" className="mt-auto block">
        <Button
          className={`w-full rounded-xl h-12 font-semibold text-sm transition-all duration-200 hover:scale-[1.02] ${
            isPopular
              ? "bg-gold hover:bg-gold/90 text-white shadow-sm"
              : "bg-gray-900 hover:bg-gray-800 text-white"
          }`}
        >
          Get Started
        </Button>
      </Link>
    </motion.div>
  );
};

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  const {
    data: plans = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<SubscriptionPlanDto[]>({
    queryKey: ["subscription-plans"],
    queryFn: fetchSubscriptionPlans,
    staleTime: 60_000,
  });

  const popularIndex = plans.length === 1 ? 0 : Math.floor(plans.length / 2);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-zinc-950 pt-32 pb-20">
        <div className="container text-center max-w-2xl mx-auto space-y-4">
          <p className="font-script text-gold text-4xl -rotate-1">Simple &amp; Transparent</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white">
            Pricing Plans
          </h1>
          <p className="text-white/55 text-lg leading-relaxed">
            Choose the plan that fits your vision. Scale gracefully as you grow.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={`text-sm font-semibold ${!isYearly ? "text-white" : "text-white/40"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isYearly ? "bg-gold" : "bg-white/20"}`}
              aria-pressed={isYearly}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm"
                animate={{ x: isYearly ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-2 ${isYearly ? "text-white" : "text-white/40"}`}>
              Yearly
              {isYearly && (
                <span className="bg-gold/20 text-gold text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="container pb-24 -mt-8">
        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading plans…</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-gray-500 text-sm">Could not load pricing plans.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 rounded-xl h-9 border-gray-200 text-gray-700"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && plans.length > 0 && (
          <div
            className={`grid grid-cols-1 gap-6 max-w-6xl mx-auto ${
              plans.length === 1
                ? "md:grid-cols-1 max-w-sm"
                : plans.length === 2
                ? "md:grid-cols-2 max-w-3xl"
                : "md:grid-cols-3"
            }`}
          >
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isPopular={i === popularIndex}
                isYearly={isYearly}
                index={i}
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && plans.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-16">
            No plans available at this time.
          </p>
        )}
      </div>

      <Footer />
    </motion.div>
  );
};

export default Pricing;
