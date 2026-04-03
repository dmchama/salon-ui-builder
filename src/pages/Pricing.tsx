import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Starter",
    monthlyPrice: "Free",
    yearlyPrice: "Free",
    period: "",
    yearlyPeriod: "",
    description: "Perfect for trying out the platform.",
    features: ["1 Salon Profile", "Basic Service Listing", "Up to 10 Bookings/month", "Email Support"],
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: "Rs. 2,500",
    yearlyPrice: "Rs. 24,000",
    period: "/month",
    yearlyPeriod: "/year",
    description: "Everything you need to grow your salon.",
    features: ["1 Salon Profile", "Unlimited Services", "Unlimited Bookings", "Gallery & Photos", "Priority Support", "Social Media Links"],
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: "Rs. 5,000",
    yearlyPrice: "Rs. 48,000",
    period: "/month",
    yearlyPeriod: "/year",
    description: "For salon chains and multi-location businesses.",
    features: ["Up to 5 Salon Profiles", "Everything in Professional", "Analytics Dashboard", "Custom Branding", "Dedicated Account Manager", "API Access"],
    popular: false,
  },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-32 pb-24">
        <div className="container text-center space-y-6 mb-16 max-w-2xl mx-auto">
          <h1 className="font-display text-4xl font-bold uppercase tracking-widest text-black">Transparent Pricing</h1>
          <p className="text-black/60 font-light tracking-wide text-lg">Choose a plan that fits your vision. Scale gracefully as you grow.</p>
          
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm tracking-widest font-bold uppercase ${!isYearly ? 'text-black' : 'text-black/40'}`}>Monthly</span>
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
            <span className={`text-sm tracking-widest font-bold uppercase flex items-center gap-2 ${isYearly ? 'text-black' : 'text-black/40'}`}>
              Yearly <Badge className="bg-gold text-white uppercase tracking-widest text-[10px] rounded-none py-0.5 hover:bg-gold">Save 20%</Badge>
            </span>
          </div>
        </div>

        <div className="container grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative h-full flex flex-col p-8 ${plan.popular ? "bg-black text-white" : "bg-white text-black border border-black/10"}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                   <div className="bg-gold text-white uppercase tracking-widest text-[10px] px-6 py-1.5 font-bold">Most Popular</div>
                </div>
              )}
              <div className="text-left mb-8 border-b pb-8 border-black/10">
                <h3 className="font-display text-xl uppercase tracking-widest font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm font-light tracking-wide ${plan.popular ? "text-white/70" : "text-black/60"}`}>{plan.description}</p>
                <div className="mt-8 flex items-baseline gap-2 h-10">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="font-display text-4xl font-bold tracking-widest block"
                    >
                      {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </motion.span>
                  </AnimatePresence>
                  <span className={`text-xs uppercase tracking-widest ${plan.popular ? "text-white/50" : "text-black/50"}`}>
                    {isYearly ? plan.yearlyPeriod : plan.period}
                  </span>
                </div>
              </div>
              
              <ul className="space-y-4 flex-1 mb-10">
                {plan.features.map(f => (
                  <li key={f} className={`flex items-start gap-3 text-sm tracking-wide font-light ${plan.popular ? "text-white/90" : "text-black/80"}`}>
                    <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.popular ? "text-gold" : "text-gold"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/register" className="mt-auto block">
                <Button className={`w-full rounded-none tracking-widest uppercase font-bold py-6 text-xs transition-colors ${plan.popular ? "bg-gold hover:bg-gold/90 text-white" : "bg-transparent border border-black text-black hover:bg-black hover:text-white"}`}>
                  Get Started
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </motion.div>
  );
};

export default Pricing;
