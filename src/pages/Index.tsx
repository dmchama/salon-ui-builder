import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, CalendarCheck, Store } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SalonCard from "@/components/SalonCard";
import { salons } from "@/data/mockSalons";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 gradient-hero">
        <div className="container text-center space-y-6 py-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight"
          >
            Discover & Book<br />
            <span className="text-primary">Your Perfect Salon</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Browse top-rated salons, explore services, and book appointments — all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/salons">
              <Button size="lg" className="gap-2">
                <Search className="h-4 w-4" />
                Browse Salons
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="gap-2">
                <Store className="h-4 w-4" />
                List Your Salon
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <h2 className="font-display text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Browse & Search", desc: "Find salons by name, location, or the service you need." },
              { icon: Sparkles, title: "Explore Services", desc: "View detailed profiles, galleries, pricing, and reviews." },
              { icon: CalendarCheck, title: "Book Instantly", desc: "Pick your service, choose a time, and confirm your booking." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center p-6 rounded-lg bg-card border shadow-soft"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Salons */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold">Featured Salons</h2>
            <Link to="/salons">
              <Button variant="ghost" className="text-primary">View All →</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {salons.map((salon) => (
              <SalonCard
                key={salon.id}
                id={salon.id}
                name={salon.name}
                image={salon.image}
                location={salon.location}
                rating={salon.rating}
                services={salon.services.map(s => s.category).filter((v, i, a) => a.indexOf(v) === i)}
                priceRange={salon.priceRange}
                isOpen={salon.isOpen}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container text-center space-y-6">
          <h2 className="font-display text-3xl font-bold">Own a Salon?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Join GlamBook and reach more customers. Set up your profile in minutes and start accepting bookings online.</p>
          <Link to="/pricing">
            <Button size="lg">View Plans & Pricing</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
