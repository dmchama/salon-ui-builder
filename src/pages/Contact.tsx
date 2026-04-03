import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent successfully. We'll be in touch soon!");
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero */}
      <section className="relative pt-32 pb-20 min-h-[50vh] flex items-center justify-start overflow-hidden bg-black neon-edge-glow">
        <div className="container relative z-20 text-left mt-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <p className="font-script text-gold text-4xl md:text-5xl mb-2 -rotate-1 drop-shadow-md">Connect With Us</p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gold via-yellow-100 to-gold tracking-widest leading-tight mb-4 drop-shadow-[0_0_15px_rgba(194,155,103,0.3)]">
              GET IN TOUCH
            </h1>
            <p className="text-lg text-white/90 font-light tracking-wide mb-6 max-w-xl leading-relaxed">
              Whether you have a question about our services, pricing, or luxury experiences, our team is ready to answer all your questions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-white text-black">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            
            {/* Left: Contact Info */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6 }}
               className="space-y-10"
            >
              <div>
                <h2 className="font-display text-3xl font-black uppercase tracking-tighter mb-2">Reach Out</h2>
                <div className="w-16 h-1 bg-gold mb-8"></div>
                <p className="text-black/60 font-light tracking-wide leading-relaxed">
                  Have inquiries about an upcoming event, bridal package, or a custom salon experience? Don't hesitate to reach out. We aim to respond to all inquiries within 24 hours.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-black flex items-center justify-center text-gold shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest text-sm mb-1">Our Studio</h4>
                    <p className="text-black/60 text-sm leading-relaxed tracking-wide">1204 Luxury Blvd<br/>Suite 400<br/>Colombo, Sri Lanka</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-black flex items-center justify-center text-gold shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest text-sm mb-1">Call Us</h4>
                    <p className="text-black/60 text-sm leading-relaxed tracking-wide">+94 11 234 5678</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-black flex items-center justify-center text-gold shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest text-sm mb-1">Email</h4>
                    <p className="text-black/60 text-sm leading-relaxed tracking-wide">concierge@glambook.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-black flex items-center justify-center text-gold shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest text-sm mb-1">Opening Hours</h4>
                    <p className="text-black/60 text-sm leading-relaxed tracking-wide">Mon - Sat: 9:00 AM - 8:00 PM<br/>Sun: 10:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Contact Form */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-gray-50 border-t-4 border-black p-10 mt-10 md:mt-0">
                <h3 className="font-display text-2xl font-black uppercase tracking-tighter mb-8">Send a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-black/60">Full Name</Label>
                    <Input 
                      required
                      className="rounded-none border-black/20 focus-visible:ring-gold focus-visible:border-gold bg-white py-6" 
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-black/60">Email Address</Label>
                      <Input 
                        required
                        type="email" 
                        className="rounded-none border-black/20 focus-visible:ring-gold focus-visible:border-gold bg-white py-6" 
                        placeholder="jane@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-black/60">Phone</Label>
                      <Input 
                        className="rounded-none border-black/20 focus-visible:ring-gold focus-visible:border-gold bg-white py-6" 
                        placeholder="+94 77 ..."
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-black/60">Message</Label>
                    <Textarea 
                      required
                      className="rounded-none border-black/20 focus-visible:ring-gold focus-visible:border-gold bg-white min-h-[150px] resize-none" 
                      placeholder="How can we help you?"
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-black text-white hover:bg-gold rounded-none px-12 py-7 text-sm font-bold uppercase tracking-widest transition-all">
                    Send Message
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Contact;
