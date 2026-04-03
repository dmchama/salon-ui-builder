import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SalonCard from "@/components/SalonCard";
import { salons, initialHeroSlides, HeroSlide } from "@/data/mockSalons";

const Index = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("heroSlides");
    if (stored) {
      setSlides(JSON.parse(stored));
    } else {
      setSlides(initialHeroSlides);
      localStorage.setItem("heroSlides", JSON.stringify(initialHeroSlides));
    }
  }, []);

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
      <section className="relative pt-32 pb-32 min-h-[90vh] flex items-center justify-start overflow-hidden">
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
        <div className="absolute inset-0 bg-black/30 z-10 transition-colors duration-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/80 via-transparent to-[#0a0a0f]/80 z-10"></div>

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
                <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-widest leading-tight mb-4">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl text-white/80 font-light tracking-wide mb-10 max-w-xl leading-relaxed">
                  {slide.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <Link to="/salons">
                    <Button size="lg" className="bg-transparent border border-white text-white hover:bg-white hover:text-black rounded-none px-12 py-7 text-sm font-bold uppercase tracking-widest transition-all">
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
                   className={`h-1 transition-all duration-500 rounded-full ${idx === currentSlide ? 'w-10 bg-gold' : 'w-4 bg-white/30 hover:bg-white/50'}`}
                 />
               ))}
             </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-20 space-y-4">
             <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-widest text-black">What We Do</h2>
             <p className="text-black/60 font-light tracking-wide max-w-2xl mx-auto">We offer a full range of luxurious hair and beauty services tailored exactly to your needs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
                className="group cursor-pointer border border-black/5 hover:border-gold/30 transition-all p-12 bg-white text-center hover:shadow-[0_10px_40px_rgba(0,0,0,0.03)]"
              >
                <div className="w-16 h-16 bg-gold/5 flex items-center justify-center mx-auto mb-8 text-gold group-hover:scale-110 transition-transform duration-500">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-lg mb-4 tracking-widest uppercase text-black">{step.title}</h3>
                <p className="text-black/60 font-light leading-relaxed text-sm tracking-wide">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Salons */}
      <section className="py-24 bg-[#FDFDFD] border-t border-black/5">
        <div className="container max-w-7xl">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-16 border-b border-black/10 pb-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-widest">Featured Salons</h2>
            <Link to="/salons" className="text-xs font-bold tracking-widest uppercase text-black/40 hover:text-gold transition-colors mt-4 md:mt-0">
              View All Locations →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
      <section className="py-32 bg-black text-white px-6">
        <div className="container text-center space-y-8 max-w-3xl">
          <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-widest">Own a Salon?</h2>
          <p className="text-white/60 font-light tracking-wide text-lg mt-4 max-w-xl mx-auto">Join GlamBook and reach more customers. Set up your luxury profile in minutes and start accepting bookings online.</p>
          <div className="pt-8">
            <Link to="/pricing">
               <Button className="bg-gold hover:bg-gold/90 text-white rounded-none px-12 py-7 text-sm font-bold uppercase tracking-widest transition-all">
                  Partner With Us
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
