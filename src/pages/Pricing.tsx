import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for trying out the platform.",
    features: ["1 Salon Profile", "Basic Service Listing", "Up to 10 Bookings/month", "Email Support"],
    popular: false,
  },
  {
    name: "Professional",
    price: "Rs. 2,500",
    period: "/month",
    description: "Everything you need to grow your salon.",
    features: ["1 Salon Profile", "Unlimited Services", "Unlimited Bookings", "Gallery & Photos", "Priority Support", "Social Media Links"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Rs. 5,000",
    period: "/month",
    description: "For salon chains and multi-location businesses.",
    features: ["Up to 5 Salon Profiles", "Everything in Professional", "Analytics Dashboard", "Custom Branding", "Dedicated Account Manager", "API Access"],
    popular: false,
  },
];

const Pricing = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="pt-24 pb-16">
      <div className="container text-center space-y-4 mb-12">
        <h1 className="font-display text-4xl font-bold">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Choose a plan that fits your salon. Upgrade or cancel anytime.</p>
      </div>

      <div className="container grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`relative h-full flex flex-col ${plan.popular ? "border-primary shadow-elevated" : "shadow-soft"}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Most Popular</Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="font-display text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-6 block">
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
    <Footer />
  </div>
);

export default Pricing;
