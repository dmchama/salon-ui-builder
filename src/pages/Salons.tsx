import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
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
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container">
          <h1 className="font-display text-3xl font-bold mb-8">Browse Salons</h1>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by salon name or service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No salons found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </div>
  );
};

export default Salons;
