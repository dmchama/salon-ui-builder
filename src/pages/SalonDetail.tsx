import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Star, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { salons, technicians } from "@/data/mockSalons";

const SalonDetail = () => {
  const { id } = useParams();
  const salon = salons.find(s => s.id === id);
  const salonTechnicians = salon ? technicians[salon.id] : [];

  if (!salon) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 container text-center py-20">
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-black">Salon not found</h1>
          <Link to="/salons"><Button variant="outline" className="mt-6 rounded-none uppercase tracking-widest text-xs">Back to Salons</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-20">
        {/* Cover */}
        <div className="relative h-72 md:h-[500px] overflow-hidden">
          <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-10 left-0 right-0 container">
            <Link to="/salons" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-gold mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Go Back
            </Link>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-widest mb-4">{salon.name}</h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-gold">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-white font-bold text-lg">{salon.rating}</span>
                <span className="text-white/60 tracking-wider text-sm font-light">({salon.reviewCount} reviews)</span>
              </div>
              <Badge variant={salon.isOpen ? "default" : "secondary"} className={salon.isOpen ? "bg-emerald-500 text-emerald-50 uppercase tracking-widest text-xs rounded-none" : "bg-black/50 text-white uppercase tracking-widest text-xs rounded-none border-none"}>
                {salon.isOpen ? "Open Now" : "Closed"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="container py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-16">
              {/* About */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-black mb-6">Our Philosophy</h2>
                <div className="h-0.5 w-12 bg-gold mb-6" />
                <p className="text-black/60 font-light leading-relaxed text-lg">{salon.description}</p>
              </motion.div>

              {/* Services */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-black mb-6">Signature Services</h2>
                <div className="h-0.5 w-12 bg-gold mb-8" />
                <div className="space-y-4">
                  {salon.services.map(service => (
                    <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-black/[0.02] border border-black/5 hover:border-gold/50 transition-colors">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        {service.image && (
                          <div className="hidden sm:block w-16 h-16 shrink-0 border border-black/10 overflow-hidden">
                            <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-display font-bold text-lg uppercase tracking-widest text-black mb-1">{service.name}</h4>
                          <p className="text-sm text-black/50 font-light tracking-wide">{service.description} · <span className="text-black/70 font-medium">{service.duration}</span></p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                        <span className="font-bold text-lg mb-0 sm:mb-2 tracking-widest">Rs. {service.price.toLocaleString()}</span>
                        <Link to={`/booking/${salon.id}?service=${service.id}`}>
                          <Button size="sm" className="bg-transparent border border-black text-black hover:bg-black hover:text-white rounded-none uppercase tracking-widest text-xs px-6">Book</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Technicians */}
              {salonTechnicians && salonTechnicians.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-black mb-6">Our Professionals</h2>
                  <div className="h-0.5 w-12 bg-gold mb-8" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {salonTechnicians.map(tech => (
                      <div key={tech.id} className="group relative overflow-hidden bg-black/[0.02] border border-black/5 hover:border-gold/50 transition-colors flex flex-col items-center p-6 text-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-gold/20 group-hover:border-gold transition-colors">
                          <img src={tech.image} alt={tech.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <h4 className="font-display font-bold text-sm uppercase tracking-widest text-black mb-2">{tech.name}</h4>
                        <p className="text-[10px] text-black/50 font-light tracking-widest uppercase">{tech.experience} Exp.</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Gallery */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-black mb-6">Gallery</h2>
                <div className="h-0.5 w-12 bg-gold mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {salon.gallery.map((img, i) => (
                    <div key={i} className="overflow-hidden aspect-square border border-black/5">
                      <img src={img} alt={`${salon.name} gallery ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700 ease-in-out cursor-pointer" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-12">
              {/* Book CTA */}
              <div className="p-8 border border-gold/50 text-center bg-gold/5">
                <h3 className="font-display font-bold text-xl uppercase tracking-widest text-black mb-4">Book Your Session</h3>
                <p className="text-sm font-light text-black/60 mb-8 tracking-wide">Secure your spot with our professionals.</p>
                <Link to={`/booking/${salon.id}`}>
                  <Button className="w-full bg-gold text-white hover:bg-gold/90 rounded-none uppercase tracking-widest font-bold py-6">Book Appointment</Button>
                </Link>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black mb-6">Contact & Location</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 text-sm text-black/70 tracking-wide font-light">
                    <MapPin className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                    <span>{salon.address}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-black/70 tracking-wide font-light">
                    <Phone className="h-5 w-5 text-gold shrink-0" />
                    <span>{salon.phone}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-black/70 tracking-wide font-light">
                    <Mail className="h-5 w-5 text-gold shrink-0" />
                    <span>{salon.email}</span>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div>
                <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black mb-6">Business Hours</h3>
                <div className="space-y-3">
                  {salon.openingHours.map(({ day, hours }) => (
                    <div key={day} className="flex justify-between text-sm py-2 border-b border-black/5 last:border-0">
                      <span className="text-black/60 font-light tracking-wide uppercase">{day}</span>
                      <span className={hours === "Closed" ? "text-red-500 font-medium tracking-widest uppercase text-xs" : "text-black font-medium tracking-widest"}>{hours}</span>
                    </div>
                  ))}
                </div>
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
