import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Star, Clock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { salons } from "@/data/mockSalons";

const SalonDetail = () => {
  const { id } = useParams();
  const salon = salons.find(s => s.id === id);

  if (!salon) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 container text-center py-20">
          <h1 className="font-display text-2xl font-bold">Salon not found</h1>
          <Link to="/salons"><Button variant="outline" className="mt-4">Back to Salons</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20">
        {/* Cover */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <div className="absolute bottom-6 left-0 right-0 container">
            <Link to="/salons" className="inline-flex items-center gap-1 text-sm text-primary-foreground/80 hover:text-primary-foreground mb-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">{salon.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-gold">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-primary-foreground font-medium">{salon.rating}</span>
                <span className="text-primary-foreground/70 text-sm">({salon.reviewCount} reviews)</span>
              </div>
              <Badge variant={salon.isOpen ? "default" : "secondary"} className={salon.isOpen ? "bg-emerald-500 text-emerald-50" : ""}>
                {salon.isOpen ? "Open Now" : "Closed"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle className="font-display">About</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{salon.description}</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Services */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader><CardTitle className="font-display">Services</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {salon.services.map(service => (
                      <div key={service.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors">
                        <div>
                          <h4 className="font-medium text-card-foreground">{service.name}</h4>
                          <p className="text-sm text-muted-foreground">{service.description} · {service.duration}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-foreground">Rs. {service.price.toLocaleString()}</span>
                          <div>
                            <Link to={`/booking/${salon.id}?service=${service.id}`}>
                              <Button size="sm" variant="outline" className="mt-1 text-xs">Book</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Gallery */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader><CardTitle className="font-display">Gallery</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {salon.gallery.map((img, i) => (
                        <div key={i} className="rounded-md overflow-hidden aspect-square">
                          <img src={img} alt={`${salon.name} gallery ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Book CTA */}
              <Card className="border-primary/30">
                <CardContent className="p-6 text-center space-y-4">
                  <h3 className="font-display font-semibold text-lg">Ready to Book?</h3>
                  <p className="text-sm text-muted-foreground">Choose a service and pick your preferred time.</p>
                  <Link to={`/booking/${salon.id}`}>
                    <Button className="w-full" size="lg">Book Appointment</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader><CardTitle className="font-display text-base">Contact</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{salon.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{salon.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{salon.email}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Hours */}
              <Card>
                <CardHeader><CardTitle className="font-display text-base">Opening Hours</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {salon.openingHours.map(({ day, hours }) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{day}</span>
                      <span className={hours === "Closed" ? "text-destructive font-medium" : "text-foreground font-medium"}>{hours}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SalonDetail;
