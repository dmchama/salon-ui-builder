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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex justify-center items-center gap-2 text-gray-400 py-24">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !salon) {
    const msg = error instanceof ApiError ? error.message : "Salon not found";
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 container text-center py-20">
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">{msg}</h1>
          <p className="text-gray-500 mt-4 text-sm max-w-md mx-auto leading-relaxed">
            Published salons only are visible here. Ask the owner to publish from the dashboard.
          </p>
          <Link to="/salons">
            <Button variant="outline" className="mt-6 rounded-xl h-10 px-5 border-gray-200 text-gray-700 text-sm">
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="pt-16">
        <div className="relative h-72 md:h-[520px] overflow-hidden">
          <img src={heroImage} alt={salon.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/40" />
          <div className="absolute bottom-0 left-0 right-0 container pb-10">
            <Link
              to="/salons"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white/65 hover:text-white mb-5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> All Salons
            </Link>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white tracking-tight mb-4">
              {salon.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Star className="h-4 w-4 fill-gold text-gold" />
                <span className="text-white font-semibold text-sm">5.0</span>
                <span className="text-white/60 text-xs">Featured</span>
              </div>
              <Badge className="bg-emerald-500/80 text-white text-xs rounded-full border-none backdrop-blur-sm px-3 py-1">
                Published
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-14">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-12">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 mb-2">About</h2>
              <div className="h-0.5 w-10 bg-gold mb-6 rounded-full" />
              <p className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap">
                {salon.description?.trim() || "No description yet."}
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 mb-2">Services</h2>
              <div className="h-0.5 w-10 bg-gold mb-7 rounded-full" />
              {salon.services.length === 0 ? (
                <p className="text-gray-400 text-sm">Services will appear once the owner adds them.</p>
              ) : (
                <div className="space-y-3">
                  {salon.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl p-5 shadow-soft hover:shadow-elevated transition-all duration-200 border border-gray-100/80"
                    >
                      <div>
                        <h4 className="font-display font-semibold text-base tracking-tight text-gray-900 mb-1">
                          {service.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {service.description || "—"} · {service.durationMin} min
                        </p>
                      </div>
                      <div className="text-left sm:text-right mt-4 sm:mt-0 shrink-0">
                        <span className="font-bold text-lg text-gray-900">
                          {formatPrice(service.priceCents)}
                        </span>
                        <div className="mt-2">
                          <Link to={`/booking/${salon.slug}?service=${service.id}`}>
                            <Button
                              size="sm"
                              className="rounded-full h-8 px-5 bg-gold hover:bg-gold/90 text-white text-xs font-semibold transition-all"
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
            </motion.section>

            {salon.gallery.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
              >
                <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 mb-2">Gallery</h2>
                <div className="h-0.5 w-10 bg-gold mb-7 rounded-full" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {salon.gallery.map((img, i) => (
                    <div key={img.id} className="overflow-hidden rounded-xl bg-white shadow-soft">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={img.url}
                          alt={img.caption ?? `${salon.name} gallery ${i + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 ease-out cursor-pointer"
                        />
                      </div>
                      {img.caption && (
                        <p className="text-xs text-gray-400 p-2.5">{img.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Book card */}
            <div className="bg-white rounded-2xl p-7 shadow-soft border border-gray-100/80 text-center">
              <h3 className="font-display font-bold text-lg tracking-tight text-gray-900 mb-2">
                Book Your Session
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Secure your spot with our team.
              </p>
              <Link to={`/booking/${salon.slug}`}>
                <Button className="w-full rounded-xl h-12 bg-gold hover:bg-gold/90 text-white font-semibold transition-all duration-200 hover:scale-[1.02]">
                  Book Appointment
                </Button>
              </Link>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/80">
              <h3 className="font-display font-semibold text-base tracking-tight text-gray-900 mb-4">Location</h3>
              <div className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                <span>{locationLine || "Address on request"}</span>
              </div>
            </div>

            {/* Contact */}
            {hasContact && (
              <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/80">
                <h3 className="font-display font-semibold text-base tracking-tight text-gray-900 mb-4">Contact</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  {salon.contactPhone?.trim() && (
                    <li className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                      <a href={`tel:${salon.contactPhone.replace(/\s/g, "")}`} className="hover:text-gold transition-colors">
                        {salon.contactPhone.trim()}
                      </a>
                    </li>
                  )}
                  {salon.contactEmail?.trim() && (
                    <li className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                      <a href={`mailto:${salon.contactEmail.trim()}`} className="hover:text-gold transition-colors break-all">
                        {salon.contactEmail.trim()}
                      </a>
                    </li>
                  )}
                  {salon.websiteUrl?.trim() && (
                    <li className="flex items-start gap-3">
                      <Globe className="h-4 w-4 text-gold shrink-0 mt-0.5" />
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

            {/* Hours */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/80">
              <h3 className="font-display font-semibold text-base tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold" />
                Hours
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {hoursLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </motion.div>
  );
};

export default SalonDetail;
