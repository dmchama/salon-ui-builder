import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/5">
      <div className="container flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3">
          <Scissors className="h-6 w-6 text-white" />
          <span className="font-display text-2xl font-bold tracking-widest text-white uppercase">GlamBook</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-xs font-semibold tracking-widest text-white/80 hover:text-white uppercase transition-colors">Home</Link>
          <Link to="/salons" className="text-xs font-semibold tracking-widest text-white/80 hover:text-white uppercase transition-colors">Services</Link>
          <Link to="/pricing" className="text-xs font-semibold tracking-widest text-white/80 hover:text-white uppercase transition-colors">Pricing Plans</Link>
          <Link to="/login" className="text-xs font-semibold tracking-widest text-white/80 hover:text-white uppercase transition-colors">Contact</Link>
          <Link to="/register">
            <Button className="bg-gold text-white hover:bg-gold/90 font-bold uppercase tracking-widest text-xs px-6 py-5 rounded-none border border-gold">Book Now</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black border-b border-white/10 p-4 space-y-4">
          <Link to="/" className="block text-xs font-semibold tracking-widest text-white/80 uppercase" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/salons" className="block text-xs font-semibold tracking-widest text-white/80 uppercase" onClick={() => setMobileOpen(false)}>Services</Link>
          <Link to="/pricing" className="block text-xs font-semibold tracking-widest text-white/80 uppercase" onClick={() => setMobileOpen(false)}>Pricing Plans</Link>
          <Link to="/login" className="block text-xs font-semibold tracking-widest text-white/80 uppercase" onClick={() => setMobileOpen(false)}>Contact</Link>
          <div className="pt-2">
            <Link to="/register" onClick={() => setMobileOpen(false)}>
               <Button className="w-full bg-gold text-white hover:bg-gold/90 font-bold uppercase tracking-widest text-xs py-5 rounded-none">Book Now</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
