import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SalonCard from "@/components/SalonCard";
import { fetchPublishedSalons } from "@/api/search-api";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop";

function formatLocation(city: string | null, country: string | null, address: string | null): string {
  const parts = [city, country].filter(Boolean);
  if (parts.length) return parts.join(", ");
  if (address?.trim()) return address.trim();
  return "Location on profile";
}

const Salons = () => {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  const { data: salons = [], isLoading, isError } = useQuery({
    queryKey: ["public-salons", search, locationFilter],
    queryFn: () =>
      fetchPublishedSalons({
        q: search.trim() || undefined,
        city: locationFilter === "all" ? undefined : locationFilter,
      }),
  });

  const { data: allPublished = [] } = useQuery({
    queryKey: ["public-salons", "all-cities"],
    queryFn: () => fetchPublishedSalons({}),
    staleTime: 60_000,
  });

  const locations = useMemo(() => {
    const locs = allPublished.map((s) => s.city).filter((c): c is string => Boolean(c?.trim()));
    return [...new Set(locs)].sort();
  }, [allPublished]);

  /** Cards need service-derived tags — list endpoint has no services; keep discoverability via name/description search only */
  const filtered = salons;

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
            <h1 className="font-display text-4xl font-bold uppercase tracking-widest text-black">
              Services & Salons
            </h1>
            <p className="text-black/60 font-light tracking-wide max-w-2xl mx-auto">
              Discover elite professionals and luxurious environments.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 mb-16 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <Input
                placeholder="SEARCH SALON OR DESCRIPTION..."
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
                <SelectItem value="all" className="uppercase tracking-widest text-xs">
                  All Locations
                </SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc} className="uppercase tracking-widest text-xs">
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="flex justify-center py-20 gap-2 text-black/50">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="uppercase tracking-widest text-sm">Loading salons…</span>
            </div>
          )}

          {isError && (
            <div className="text-center py-20 text-black/50 tracking-widest uppercase text-sm">
              <p>Could not load salons. Check that the API is running.</p>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="text-center py-20 text-black/50 tracking-widest uppercase text-sm">
              <p>No salons found. Owners must publish a salon before it appears here.</p>
            </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {filtered.map((salon) => (
                <SalonCard
                  key={salon.id}
                  slug={salon.slug}
                  name={salon.name}
                  image={PLACEHOLDER_IMAGE}
                  location={formatLocation(salon.city, salon.country, salon.address)}
                  rating={5}
                  services={["Browse profile"]}
                  priceRange="View pricing"
                  isOpen
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
