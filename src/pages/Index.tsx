import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SalonCard from "@/components/SalonCard";
import { initialHeroSlides } from "@/data/mockSalons";
import { fetchPublishedSalons, groupSalonsByOwner } from "@/api/search-api";
import { fetchPublicWebsiteSettings, WebsiteHeroSlide } from "@/api/admin-api";

const FEATURED_COVER =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop";

/* 4-point star used as floating hero decoration */
const SparkleGraphic = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <svg
    viewBox="0 0 12 12"
    fill="currentColor"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M6 0L7.35 4.65L12 6L7.35 7.35L6 12L4.65 7.35L0 6L4.65 4.65Z" />
  </svg>
);


const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: publishedSalons = [] } = useQuery({
    queryKey: ["public-salons", "featured"],
    queryFn: () => fetchPublishedSalons(),
  });
  const featuredSalons = groupSalonsByOwner(publishedSalons).slice(0, 4);

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
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-32 min-h-[92vh] flex items-center justify-start overflow-hidden bg-zinc-950">
        {/* Background image / video */}
        {slides.length > 0 && slide && (
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
              className="absolute inset-0 z-0"
            >
              {slide.mediaType === "video" ? (
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

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/55 to-black/10 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10" />

        {/* Floating sparkle decorations */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <SparkleGraphic
            className="absolute text-amber-400/50 animate-sparkle"
            style={{ top: "22%", right: "18%", width: 18, height: 18, animationDelay: "0s" }}
          />
          <SparkleGraphic
            className="absolute text-amber-300/35 animate-sparkle"
            style={{ top: "55%", right: "30%", width: 11, height: 11, animationDelay: "0.9s" }}
          />
          <SparkleGraphic
            className="absolute text-gold/40 animate-sparkle"
            style={{ top: "38%", right: "12%", width: 8, height: 8, animationDelay: "1.7s" }}
          />
          <SparkleGraphic
            className="absolute text-amber-500/30 animate-sparkle animate-float"
            style={{ top: "72%", right: "42%", width: 14, height: 14, animationDelay: "0.4s" }}
          />
          {/* Subtle ambient orbs */}
          <div
            className="absolute rounded-full bg-amber-500/10 blur-3xl"
            style={{ top: "20%", right: "15%", width: 300, height: 300 }}
          />
          <div
            className="absolute rounded-full bg-gold/8 blur-2xl"
            style={{ bottom: "20%", right: "25%", width: 200, height: 200 }}
          />
        </div>

        {/* Brand badge */}
        <div className="absolute top-24 right-8 z-20 hidden lg:flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">
            SalonBooking.com
          </span>
        </div>

        {/* Hero content */}
        <div className="container relative z-20 text-left mt-8">
          <AnimatePresence mode="wait">
            {slide && (
              <motion.div
                key={`text-${slide.id}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="max-w-3xl"
              >
                <p className="font-script text-gold text-4xl md:text-5xl mb-3 -rotate-1 drop-shadow-md">
                  Premium Experience
                </p>
                <h1 className="font-display text-5xl sm:text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tight mb-6">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl text-white/70 font-light mb-10 max-w-xl leading-relaxed">
                  {slide.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <Link to="/salons">
                    <Button
                      size="lg"
                      className="bg-white text-black hover:bg-white/90 rounded-full px-8 py-3 font-semibold text-sm shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      {slide.buttonText}
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-transparent border-white/25 text-white hover:bg-white/10 hover:text-white hover:border-white/40 rounded-full px-8 py-3 font-semibold text-sm backdrop-blur-sm transition-all duration-200"
                    >
                      View Plans
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>

                {/* Slide indicators */}
                {slides.length > 1 && (
                  <div className="flex items-center gap-2 mt-10 pt-6 border-t border-white/10">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-1.5 transition-all duration-500 rounded-full ${
                          idx === currentSlide ? "w-10 bg-white" : "w-3 bg-white/50 hover:bg-white/75"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="py-28 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-20 space-y-3">
            <p className="font-script text-gold text-4xl md:text-5xl -rotate-1">Experience the Best</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              What We Do
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed mt-4">
              We offer a full range of luxurious hair and beauty services tailored exactly to your
              needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Cut & Style", desc: "Precision cuts and elegant styling for any occasion." },
              { title: "Colour", desc: "From subtle balayage to complete color transformations." },
              { title: "Extensions", desc: "Premium hair extensions for volume and length." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="group cursor-pointer bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-soft hover:shadow-elevated hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-gold/10 group-hover:bg-gold/20 flex items-center justify-center mx-auto mb-7 text-gold rounded-2xl transition-colors duration-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3 tracking-tight text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Salons ── */}
      <section className="py-28 bg-background">
        <div className="container max-w-7xl">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-16 pb-6 border-b border-black/[0.06]">
            <div>
              <p className="font-script text-gold text-3xl md:text-4xl mb-1 -rotate-1">
                Discover Our
              </p>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-gray-900">
                Featured Salons
              </h2>
            </div>
            <Link
              to="/salons"
              className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-gold transition-colors mt-6 md:mt-0"
            >
              View All Locations
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredSalons.map((group) => (
              <SalonCard
                key={group.ownerId}
                group={group}
                image={group.listingImageUrl ?? FEATURED_COVER}
                rating={5}
                priceRange="View pricing"
                isOpen
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32 bg-zinc-950 text-white px-6 overflow-hidden">
        {/* Ambient decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gold/[0.14] rounded-full blur-[120px]" />
          <SparkleGraphic
            className="absolute text-amber-400/30 animate-sparkle"
            style={{ top: "20%", left: "10%", width: 20, height: 20, animationDelay: "0.3s" }}
          />
          <SparkleGraphic
            className="absolute text-amber-300/20 animate-sparkle"
            style={{ bottom: "25%", right: "8%", width: 14, height: 14, animationDelay: "1.2s" }}
          />
          <SparkleGraphic
            className="absolute text-gold/25 animate-sparkle"
            style={{ top: "60%", left: "20%", width: 10, height: 10, animationDelay: "0.7s" }}
          />
        </div>
        <div className="container text-center space-y-6 max-w-3xl relative">
          <p className="font-script text-gold text-4xl md:text-5xl mb-2">Partner With Us</p>
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
            Own a Salon?
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            Join SalonBooking.com and reach more customers. Set up your luxury profile in minutes
            and start accepting bookings online.
          </p>
          <div className="pt-8">
            <Link to="/pricing">
              <Button className="text-white rounded-full px-10 py-4 text-sm font-semibold shadow-lg bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 border-0 transition-all duration-200 hover:scale-105 hover:shadow-amber-600/30">
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
