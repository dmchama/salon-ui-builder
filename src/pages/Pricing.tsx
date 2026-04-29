import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const displayPrice = isYearly ? yearlyPrice(plan.priceCents, plan.currency) : formatPrice(plan.priceCents, plan.currency);
  const period = plan.priceCents === 0 ? "" : isYearly ? "/year" : intervalSuffix(plan.intervalMonths);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative h-full flex flex-col p-8 ${isPopular ? "bg-black text-white" : "bg-white text-black border border-black/10"}`}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="bg-gold text-white uppercase tracking-widest text-[10px] px-6 py-1.5 font-bold">Most Popular</div>
        </div>
      )}

      <div className="text-left mb-8 border-b pb-8 border-black/10">
        <h3 className="font-display text-xl uppercase tracking-widest font-bold mb-2">{plan.name}</h3>
        {plan.description && (
          <p className={`text-sm font-light tracking-wide ${isPopular ? "text-white/70" : "text-black/60"}`}>
            {plan.description}
          </p>
        )}
        <div className="mt-8 flex items-baseline gap-2 h-10">
          <AnimatePresence mode="wait">
            <motion.span
              key={displayPrice}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="font-display text-4xl font-bold tracking-widest block"
            >
              {displayPrice}
            </motion.span>
          </AnimatePresence>
          <span className={`text-xs uppercase tracking-widest ${isPopular ? "text-white/50" : "text-black/50"}`}>
            {period}
          </span>
        </div>
        {isYearly && plan.priceCents > 0 && (
          <p className={`text-xs mt-2 tracking-wide ${isPopular ? "text-white/50" : "text-black/40"}`}>
            Save 20% vs monthly billing
          </p>
        )}
      </div>

      <ul className="space-y-4 flex-1 mb-10">
        {features.map((f) => (
          <li key={f} className={`flex items-start gap-3 text-sm tracking-wide font-light ${isPopular ? "text-white/90" : "text-black/80"}`}>
            <Check className="h-4 w-4 shrink-0 mt-0.5 text-gold" />
            <span>{f}</span>
          </li>
        ))}
        {features.length === 0 && (
          <li className={`text-sm font-light tracking-wide ${isPopular ? "text-white/50" : "text-black/40"}`}>
            Contact us for details
          </li>
        )}
      </ul>

      <Link to="/register" className="mt-auto block">
        <Button
          className={`w-full rounded-none tracking-widest uppercase font-bold py-6 text-xs transition-colors ${
            isPopular
              ? "bg-gold hover:bg-gold/90 text-white"
              : "bg-transparent border border-black text-black hover:bg-black hover:text-white"
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

  const { data: plans = [], isLoading, isError, refetch } = useQuery<SubscriptionPlanDto[]>({
    queryKey: ["subscription-plans"],
    queryFn: fetchSubscriptionPlans,
    staleTime: 60_000,
  });

  const popularIndex = plans.length === 1 ? 0 : Math.floor(plans.length / 2);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-32 pb-24">
        <div className="container text-center space-y-6 mb-16 max-w-2xl mx-auto">
          <h1 className="font-display text-4xl font-bold uppercase tracking-widest text-black">Transparent Pricing</h1>
          <p className="text-black/60 font-light tracking-wide text-lg">Choose a plan that fits your vision. Scale gracefully as you grow.</p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm tracking-widest font-bold uppercase ${!isYearly ? "text-black" : "text-black/40"}`}>Monthly</span>
            <div
              className="w-16 h-8 bg-black/5 rounded-full cursor-pointer relative flex items-center p-1 border border-black/10"
              onClick={() => setIsYearly(!isYearly)}
            >
              <motion.div
                className="w-6 h-6 bg-gold rounded-full shadow-sm"
                layout
                animate={{ x: isYearly ? 32 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
            <span className={`text-sm tracking-widest font-bold uppercase flex items-center gap-2 ${isYearly ? "text-black" : "text-black/40"}`}>
              Yearly <Badge className="bg-gold text-white uppercase tracking-widest text-[10px] rounded-none py-0.5 hover:bg-gold">Save 20%</Badge>
            </span>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-3 text-black/40">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="uppercase tracking-widest text-sm">Loading plans…</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-black/50 tracking-wide text-sm">Could not load pricing plans.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 rounded-none uppercase tracking-widest text-xs">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && plans.length > 0 && (
          <div className={`container grid grid-cols-1 gap-8 max-w-6xl ${plans.length === 1 ? "md:grid-cols-1 max-w-sm" : plans.length === 2 ? "md:grid-cols-2 max-w-3xl" : "md:grid-cols-3"}`}>
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
          <p className="text-center text-black/40 tracking-widest text-sm uppercase py-16">No plans available at this time.</p>
        )}
      </div>
      <Footer />
    </motion.div>
  );
};

export default Pricing;
