import { useParams, useSearchParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck, ArrowLeft, CheckCircle2, Star, User } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { salons, technicians } from "@/data/mockSalons";

const Booking = () => {
  const { salonId } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get("service") || "";
  const salon = salons.find(s => s.id === salonId);

  const [selectedService, setSelectedService] = useState(preselectedService);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const filteredTechnicians = useMemo(() => {
    if (!salonId || !selectedService) return [];
    const salonTechs = technicians[salonId] || [];
    return salonTechs.filter(t => t.specializations.includes(selectedService));
  }, [salonId, selectedService]);

  // Reset technician when service changes
  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    setSelectedTechnician("");
  };

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

  const service = salon.services.find(s => s.id === selectedService);
  const technician = filteredTechnicians.find(t => t.id === selectedTechnician);
  const times = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 container max-w-lg text-center py-20 space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold">Booking Confirmed!</h1>
          <p className="text-muted-foreground">Your appointment at <strong>{salon.name}</strong> has been booked.</p>
          <Card>
            <CardContent className="p-6 space-y-2 text-left">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service</span><span className="font-medium">{service?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Technician</span><span className="font-medium">{technician?.name || "Any available"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date</span><span className="font-medium">{date}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Time</span><span className="font-medium">{time}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium">{name}</span></div>
            </CardContent>
          </Card>
          <Link to="/"><Button>Back to Home</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container max-w-2xl">
          <Link to={`/salon/${salon.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to {salon.name}
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <CalendarCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-display text-2xl font-bold">Book Appointment</h1>
              <p className="text-sm text-muted-foreground">{salon.name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="font-display text-base">Select Service</CardTitle></CardHeader>
              <CardContent>
                <Select value={selectedService} onValueChange={handleServiceChange}>
                  <SelectTrigger><SelectValue placeholder="Choose a service" /></SelectTrigger>
                  <SelectContent>
                    {salon.services.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — Rs. {s.price.toLocaleString()} ({s.duration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedService && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle className="font-display text-base">Select Technician</CardTitle></CardHeader>
                  <CardContent>
                    {filteredTechnicians.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No technicians available for this service.</p>
                    ) : (
                      <div className="grid gap-3">
                        {filteredTechnicians.map(tech => (
                          <div
                            key={tech.id}
                            onClick={() => setSelectedTechnician(tech.id)}
                            className={`flex items-center gap-4 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedTechnician === tech.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <img
                              src={tech.image}
                              alt={tech.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{tech.name}</p>
                              <p className="text-xs text-muted-foreground">{tech.experience} experience</p>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{tech.rating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <Card>
              <CardHeader><CardTitle className="font-display text-base">Pick Date & Time</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                    <SelectContent>
                      {times.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-display text-base">Your Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+94 77 123 4567" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full" disabled={!selectedService || !date || !time || !name || !phone}>
              Confirm Booking
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Booking;
