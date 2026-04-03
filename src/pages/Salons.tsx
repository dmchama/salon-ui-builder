import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SalonCard from "@/components/SalonCard";
import { salons } from "@/data/mockSalons";

const Salons = () => {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  const locations = useMemo(() => {
    const locs = salons.map(s => s.location);
    return [...new Set(locs)];
  }, []);

  const filtered = useMemo(() => {
    return salons.filter(s => {
      const matchName = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.services.some(sv => sv.name.toLowerCase().includes(search.toLowerCase()));
      const matchLoc = locationFilter === "all" || s.location === locationFilter;
      return matchName && matchLoc;
    });
  }, [search, locationFilter]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="min-h-screen bg-white"
    >
      <Navbar />
      <div className="pt-32 pb-24">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
             <h1 className="font-display text-4xl font-bold uppercase tracking-widest text-black">Services & Salons</h1>
             <p className="text-black/60 font-light tracking-wide max-w-2xl mx-auto">Discover elite professionals and luxurious environments.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-6 mb-16 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <Input
                placeholder="SEARCH SALON OR SERVICE..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus-visible:ring-0 focus-visible:border-gold text-sm tracking-widest py-6 bg-transparent h-auto"
              />
            </div>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-64 rounded-none border-t-0 border-x-0 border-b-2 border-black/10 focus:ring-0 text-sm tracking-widest uppercase py-6 bg-transparent h-auto">
                <SelectValue placeholder="LOCATIONS" />
              </SelectTrigger>
              <SelectContent className="rounded-none border border-black/5 rounded-sm">
                <SelectItem value="all" className="uppercase tracking-widest text-xs">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc} className="uppercase tracking-widest text-xs">{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-black/50 tracking-widest uppercase text-sm">
              <p>No luxurious spots found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {filtered.map((salon) => (
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
          )}
        </div>
      </div>
      <Footer />
    </motion.div>
  );
};

export default Salons;
