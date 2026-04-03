import { useParams, useSearchParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, Star } from "lucide-react";
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
  const [paymentOption, setPaymentOption] = useState("pay-at-salon");
  const [submitted, setSubmitted] = useState(false);

  const filteredTechnicians = useMemo(() => {
    if (!salonId || !selectedService || !time) return [];
    const salonTechs = technicians[salonId] || [];
    return salonTechs.filter(t => {
      const matchService = t.specializations.includes(selectedService);
      const timeNum = parseInt(time.replace(':', '')) || 0;
      const tNum = parseInt(t.id.replace(/\D/g, '')) || 0;
      const isAvailable = (timeNum + tNum) % 3 !== 0;
      return matchService && isAvailable;
    });
  }, [salonId, selectedService, time]);

  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    setSelectedTechnician("");
  };

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

  const service = salon.services.find(s => s.id === selectedService);
  const technician = filteredTechnicians.find(t => t.id === selectedTechnician);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 container max-w-2xl text-center py-24 space-y-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <CheckCircle className="h-20 w-20 text-gold mx-auto" />
          </motion.div>
          <div className="space-y-4">
            <h1 className="font-display text-4xl font-bold uppercase tracking-widest text-black">Booking Pending</h1>
            <p className="text-black/60 font-light tracking-wide text-lg">Your appointment request at <strong className="font-bold text-black">{salon.name}</strong> has been submitted and is pending confirmation.</p>
          </div>
          
          <div className="border border-black/10 p-8 text-left max-w-md mx-auto space-y-4">
            <div className="flex justify-between text-sm py-2 border-b border-black/5"><span className="text-black/60 uppercase tracking-widest">Service</span><span className="font-bold tracking-widest">{service?.name}</span></div>
            <div className="flex justify-between text-sm py-2 border-b border-black/5"><span className="text-black/60 uppercase tracking-widest">Technician</span><span className="font-bold tracking-widest">{technician?.name || "Any Available"}</span></div>
            <div className="flex justify-between text-sm py-2 border-b border-black/5"><span className="text-black/60 uppercase tracking-widest">Date & Time</span><span className="font-bold tracking-widest">{date} at {time}</span></div>
            <div className="flex justify-between text-sm py-2"><span className="text-black/60 uppercase tracking-widest">Payment</span><span className="font-bold tracking-widest">{paymentOption === 'pay-now' ? "Paid Online" : "Pay at Salon"}</span></div>
          </div>
          <Link to="/"><Button className="rounded-none bg-black hover:bg-gold text-white uppercase tracking-widest px-8 py-6">Return to Home</Button></Link>
        </div>
        <Footer />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-32 pb-24">
        <div className="container max-w-3xl">
          <Link to={`/salon/${salon.id}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/50 hover:text-gold mb-10 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Link>

          <div className="mb-12 border-b border-black/10 pb-8">
            <h1 className="font-display text-4xl font-bold uppercase tracking-widest text-black mb-2">Book Appointment</h1>
            <p className="font-light tracking-wide text-black/60">{salon.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-16">
            
            {/* Service Selection */}
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black">1. Select Service</h3>
              <Select value={selectedService} onValueChange={handleServiceChange}>
                <SelectTrigger className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus:ring-0 text-sm tracking-widest uppercase py-6 bg-transparent h-auto">
                  <SelectValue placeholder="CHOOSE A SERVICE" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-black/10">
                  {salon.services.map(s => (
                    <SelectItem key={s.id} value={s.id} className="uppercase tracking-widest text-xs py-3">
                      {s.name} {s.price ? `— Rs. ${s.price.toLocaleString()}` : '— Price Varies'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            {selectedService && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black">2. Schedule</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/50">Date</label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus-visible:ring-0 focus-visible:border-gold py-6 text-black tracking-widest uppercase bg-transparent h-auto" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/50">Time</label>
                    <Input type="time" value={time} onChange={e => setTime(e.target.value)} required className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus-visible:ring-0 focus-visible:border-gold py-6 text-black tracking-widest uppercase bg-transparent h-auto" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Technician Selection */}
            {selectedService && date && time && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black">3. Select Technician</h3>
                  <span className="text-xs text-black/40 uppercase tracking-widest">Optional</span>
                </div>
                {filteredTechnicians.length === 0 ? (
                  <p className="text-sm font-light tracking-wide text-black/60 italic">No specific professionals available for this service at the selected time. We will assign one automatically.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div
                      onClick={() => setSelectedTechnician("any")}
                      className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${
                        selectedTechnician === "any" || selectedTechnician === ""
                          ? "border-gold bg-gold/5"
                          : "border-black/5 hover:border-black/20"
                      }`}
                    >
                      <div className="w-12 h-12 bg-black/5 flex items-center justify-center shrink-0">
                        <Star className="h-5 w-5 text-black/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm uppercase tracking-widest">Any Available</p>
                        <p className="text-xs text-black/50 font-light mt-1 uppercase tracking-widest">No Preference</p>
                      </div>
                    </div>
                    {filteredTechnicians.map(tech => (
                      <div
                        key={tech.id}
                        onClick={() => setSelectedTechnician(tech.id)}
                        className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${
                          selectedTechnician === tech.id
                            ? "border-gold bg-gold/5"
                            : "border-black/5 hover:border-black/20"
                        }`}
                      >
                        <img src={tech.image} alt={tech.name} className="w-12 h-12 object-cover grayscale opacity-80 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm uppercase tracking-widest">{tech.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gold mt-1">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="font-bold">{tech.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Client Details */}
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black">4. Your Details</h3>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/50">Full Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="JOHN DOE" required className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus-visible:ring-0 focus-visible:border-gold py-6 text-black tracking-widest uppercase bg-transparent h-auto placeholder:text-black/20" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/50">Phone</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+94 77 123 4567" required className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus-visible:ring-0 focus-visible:border-gold py-6 text-black tracking-widest uppercase bg-transparent h-auto placeholder:text-black/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/50">Email</label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="HELLO@EXAMPLE.COM" className="rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus-visible:ring-0 focus-visible:border-gold py-6 text-black tracking-widest uppercase bg-transparent h-auto placeholder:text-black/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Payment */}
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg uppercase tracking-widest text-black">5. Payment Preference</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div onClick={() => setPaymentOption('pay-at-salon')} className={`p-6 border cursor-pointer transition-colors ${paymentOption === 'pay-at-salon' ? 'border-gold bg-gold/5' : 'border-black/5 hover:border-black/20'}`}>
                  <h4 className="font-bold uppercase tracking-widest mb-1">Pay at Salon</h4>
                  <p className="text-xs font-light text-black/60 tracking-wider">Settle your bill after your service.</p>
                </div>
                <div onClick={() => setPaymentOption('pay-now')} className={`p-6 border cursor-pointer transition-colors ${paymentOption === 'pay-now' ? 'border-gold bg-gold/5' : 'border-black/5 hover:border-black/20'}`}>
                  <h4 className="font-bold uppercase tracking-widest mb-1">Pay Now Online</h4>
                  <p className="text-xs font-light text-black/60 tracking-wider">Secure your booking by paying now.</p>
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" disabled={!selectedService || !date || !time || !name || !phone} className="w-full rounded-none bg-black hover:bg-gold text-white uppercase tracking-widest font-bold py-8 text-lg hover:-translate-y-1 transition-transform">
              Complete Booking
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </motion.div>
  );
};

export default Booking;
