import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SalonCard from "@/components/SalonCard";
import { initialHeroSlides } from "@/data/mockSalons";
import { fetchPublishedSalons } from "@/api/search-api";
import { fetchPublicWebsiteSettings, WebsiteHeroSlide } from "@/api/admin-api";

const FEATURED_COVER =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop";

function listLocation(city: string | null, country: string | null, address: string | null): string {
  const parts = [city, country].filter(Boolean);
  if (parts.length) return parts.join(", ");
  if (address?.trim()) return address.trim();
  return "Location on profile";
}

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: publishedSalons = [] } = useQuery({
    queryKey: ["public-salons", "featured"],
    queryFn: () => fetchPublishedSalons(),
  });
  const featuredSalons = publishedSalons.slice(0, 4);

  const { data: websiteSettings } = useQuery({
    queryKey: ["website-settings-public"],
    queryFn: fetchPublicWebsiteSettings,
    staleTime: 60_000,
  });

  const slides: WebsiteHeroSlide[] =
    websiteSettings?.heroSlides?.length ? websiteSettings.heroSlides : initialHeroSlides;

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-32 min-h-[90vh] flex items-center justify-start overflow-hidden bg-black neon-edge-glow">
        {slides.length > 0 && slide && (
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 z-0"
            >
              {slide.mediaType === 'video' ? (
                <video 
                  src={slide.mediaUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.mediaUrl})` }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Dark overlays for high-end cinematic feel and readability */}
        <div className="absolute inset-0 bg-black/40 z-10 transition-colors duration-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-gold/20 via-transparent to-blue-500/10 mix-blend-overlay z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/90 via-transparent to-[#0a0a0f]/90 z-10"></div>

        <div className="container relative z-20 text-left mt-10">
          <AnimatePresence mode="wait">
            {slide && (
              <motion.div
                key={`text-${slide.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-3xl"
              >
                <p className="font-script text-gold text-4xl md:text-5xl mb-2 -rotate-1 drop-shadow-md">Premium Experience</p>
                <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gold via-yellow-100 to-gold tracking-widest leading-tight mb-4 drop-shadow-[0_0_15px_rgba(194,155,103,0.3)]">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl text-white/90 font-light tracking-wide mb-10 max-w-xl leading-relaxed">
                  {slide.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <Link to="/salons">
                    <Button size="lg" className="bg-transparent border-2 border-gold text-white hover:bg-gold hover:text-black rounded-none px-12 py-7 text-sm font-bold uppercase tracking-widest transition-all">
                      {slide.buttonText}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Slide Indicators */}
          {slides.length > 1 && (
             <div className="absolute bottom-10 left-8 z-30 flex gap-3">
               {slides.map((_, idx) => (
                 <button
                   key={idx}
                   onClick={() => setCurrentSlide(idx)}
                   className={`h-1.5 transition-all duration-500 rounded-none ${idx === currentSlide ? 'w-12 bg-gold shadow-[0_0_10px_rgba(194,155,103,0.8)]' : 'w-6 bg-white/30 hover:bg-gold/50'}`}
                 />
               ))}
             </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="py-28 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-20 space-y-2">
             <p className="font-script text-gold text-4xl md:text-5xl mb-2 -rotate-2">Experience the Best</p>
             <h2 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter text-black">What We Do</h2>
             <div className="w-24 h-1 bg-gold mx-auto mt-6 mb-4"></div>
             <p className="text-black/60 font-light tracking-wide max-w-2xl mx-auto text-lg mt-4">We offer a full range of luxurious hair and beauty services tailored exactly to your needs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "CUT & STYLE", desc: "Precision cuts and elegant styling for any occasion." },
              { title: "COLOUR", desc: "From subtle balayage to complete color transformations." },
              { title: "EXTENSIONS", desc: "Premium hair extensions for volume and length." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="group cursor-pointer border-t-4 border-black hover:border-gold transition-all p-12 bg-gray-50 text-center hover:bg-black rounded-none"
              >
                <div className="w-16 h-16 bg-gold/10 group-hover:bg-gold/20 flex items-center justify-center mx-auto mb-8 text-gold group-hover:scale-110 transition-transform duration-500 rounded-none">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-display font-black text-xl mb-4 tracking-tighter uppercase text-black group-hover:text-white transition-colors">{step.title}</h3>
                <p className="text-black/60 group-hover:text-white/70 font-light leading-relaxed text-sm tracking-wide transition-colors">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Salons */}
      <section className="py-28 bg-black neon-edge-glow text-white">
        <div className="container max-w-7xl">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-16 border-b border-white/10 pb-6">
            <div>
              <p className="font-script text-gold text-3xl md:text-4xl mb-1 -rotate-2">Discover Our</p>
              <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter">Featured Salons</h2>
            </div>
            <Link to="/salons" className="text-xs font-bold tracking-widest uppercase text-white/50 hover:text-gold transition-colors mt-6 md:mt-0">
              View All Locations →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredSalons.map((salon) => (
              <SalonCard
                key={salon.id}
                slug={salon.slug}
                name={salon.name}
                image={FEATURED_COVER}
                location={listLocation(salon.city, salon.country, salon.address)}
                rating={5}
                services={["Browse profile"]}
                priceRange="View pricing"
                isOpen
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-white text-black px-6">
        <div className="container text-center space-y-6 max-w-3xl">
          <p className="font-script text-gold text-4xl md:text-5xl mb-2">Partner With Us</p>
          <h2 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter">Own a Salon?</h2>
          <div className="w-24 h-1 bg-gold mx-auto my-6"></div>
          <p className="text-black/60 font-light tracking-wide text-lg max-w-xl mx-auto">Join GlamBook and reach more customers. Set up your luxury profile in minutes and start accepting bookings online.</p>
          <div className="pt-10">
            <Link to="/pricing">
               <Button className="bg-black hover:bg-gold text-white rounded-none px-12 py-7 text-sm font-bold uppercase tracking-widest transition-all">
                  Get Started
               </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
