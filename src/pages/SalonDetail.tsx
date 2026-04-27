import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ArrowLeft, Loader2, Phone, Mail, Globe, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchPublicSalonBySlug } from "@/api/salon-api";
import { ApiError } from "@/api/http";
import { formatBusinessHoursLines, mergeBusinessHoursFromApi } from "@/lib/business-hours";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&h=800&fit=crop";

const formatPrice = (cents: number) => `Rs. ${(cents / 100).toLocaleString()}`;

function webHref(raw: string): string {
  const t = raw.trim();
  if (!t) return "#";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

const SalonDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: salon, isLoading, isError, error } = useQuery({
    queryKey: ["salon-public", slug],
    queryFn: () => fetchPublicSalonBySlug(slug!),
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 flex justify-center items-center gap-2 text-black/50 py-24">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="uppercase tracking-widest text-sm">Loading…</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !salon) {
    const msg = error instanceof ApiError ? error.message : "Salon not found";
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 container text-center py-20">
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-black">{msg}</h1>
          <p className="text-black/50 mt-4 text-sm max-w-md mx-auto">
            Published salons only are visible here. Ask the owner to publish from the dashboard.
          </p>
          <Link to="/salons">
            <Button variant="outline" className="mt-6 rounded-none uppercase tracking-widest text-xs">
              Back to Salons
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const heroImage = salon.gallery[0]?.url ?? HERO_FALLBACK;
  const locationLine = [salon.address, salon.city, salon.country].filter(Boolean).join(" · ");
  const hoursLines = formatBusinessHoursLines(mergeBusinessHoursFromApi(salon.businessHours ?? null));
  const hasContact =
    Boolean(salon.contactPhone?.trim()) ||
    Boolean(salon.contactEmail?.trim()) ||
    Boolean(salon.websiteUrl?.trim());

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-20">
        <div className="relative h-72 md:h-[500px] overflow-hidden">
          <img src={heroImage} alt={salon.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-10 left-0 right-0 container">
            <Link
              to="/salons"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-gold mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Go Back
            </Link>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-widest mb-4">
              {salon.name}
            </h1>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-gold">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-white font-bold text-lg">5</span>
                <span className="text-white/60 tracking-wider text-sm font-light">(featured)</span>
              </div>
              <Badge className="bg-emerald-500 text-emerald-50 uppercase tracking-widest text-xs rounded-none border-none">
                Published
              </Badge>
            </div>
          </div>
        </div>

        <div className="container py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-16">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-black mb-6">
                  About
                </h2>
                <div className="h-0.5 w-12 bg-gold mb-6" />
                <p className="text-black/60 font-light leading-relaxed text-lg whitespace-pre-wrap">
                  {salon.description?.trim() || "No description yet."}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-black mb-6">
                  Services
                </h2>
                <div className="h-0.5 w-12 bg-gold mb-8" />
                {salon.services.length === 0 ? (
                  <p className="text-black/50 text-sm">Services will appear here once the owner adds them.</p>
                ) : (
                  <div className="space-y-4">
                    {salon.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-black/[0.02] border border-black/5 hover:border-gold/50 transition-colors"
                      >
                        <div>
                          <h4 className="font-display font-bold text-lg uppercase tracking-widest text-black mb-1">
                            {service.name}
                          </h4>
                          <p className="text-sm text-black/50 font-light tracking-wide">
                            {service.description || "—"} · {service.durationMin} min
                          </p>
                        </div>
                        <div className="text-left sm:text-right mt-4 sm:mt-0 shrink-0">
                          <span className="font-bold text-lg tracking-widest">{formatPrice(service.priceCents)}</span>
                          <div className="mt-3">
                            <Link to={`/booking/${salon.slug}?service=${service.id}`}>
                              <Button
                                size="sm"
                                className="bg-transparent border border-black text-black hover:bg-black hover:text-white rounded-none uppercase tracking-widest text-xs px-6"
                              >
                                Book
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {salon.gallery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-black mb-6">
                    Gallery
                  </h2>
                  <div className="h-0.5 w-12 bg-gold mb-8" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {salon.gallery.map((img, i) => (
                      <div key={img.id} className="overflow-hidden border border-black/5 flex flex-col">
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.caption ?? `${salon.name} gallery ${i + 1}`}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-700 ease-in-out cursor-pointer"
                          />
                        </div>
                        {img.caption && (
                          <p className="text-xs text-black/50 tracking-wide p-2 border-t border-black/5">
                            {img.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-12">
              <div className="p-8 border border-gold/50 text-center bg-gold/5">
                <h3 className="font-display font-bold text-xl uppercase tracking-widest text-black mb-4">
                  Book Your Session
                </h3>
                <p className="text-sm font-light text-black/60 mb-8 tracking-wide">
                  Secure your spot with our team.
                </p>
                <Link to={`/booking/${salon.slug}`}>
                  <Button className="w-full bg-gold text-white hover:bg-gold/90 rounded-none uppercase tracking-widest font-bold py-6">
                    Book Appointment
                  </Button>
                </Link>
              </div>

              <div>
                <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black mb-6">
                  Location
                </h3>
                <div className="flex items-start gap-4 text-sm text-black/70 tracking-wide font-light">
                  <MapPin className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                  <span>{locationLine || "Address on request"}</span>
                </div>
              </div>

              {hasContact && (
                <div>
                  <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black mb-6">
                    Contact
                  </h3>
                  <ul className="space-y-4 text-sm text-black/70 tracking-wide font-light">
                    {salon.contactPhone?.trim() && (
                      <li className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                        <a href={`tel:${salon.contactPhone.replace(/\s/g, "")}`} className="hover:text-gold transition-colors">
                          {salon.contactPhone.trim()}
                        </a>
                      </li>
                    )}
                    {salon.contactEmail?.trim() && (
                      <li className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                        <a href={`mailto:${salon.contactEmail.trim()}`} className="hover:text-gold transition-colors break-all">
                          {salon.contactEmail.trim()}
                        </a>
                      </li>
                    )}
                    {salon.websiteUrl?.trim() && (
                      <li className="flex items-start gap-3">
                        <Globe className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                        <a
                          href={webHref(salon.websiteUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-gold transition-colors break-all"
                        >
                          {salon.websiteUrl.trim()}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gold" />
                  Hours
                </h3>
                <ul className="space-y-2 text-sm text-black/70 tracking-wide font-light">
                  {hoursLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </motion.div>
  );
};

export default SalonDetail;
