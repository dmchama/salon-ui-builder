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
import { Search, Loader2, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SalonCard from "@/components/SalonCard";
import { fetchPublishedSalons, groupSalonsByOwner } from "@/api/search-api";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop";


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

  const grouped = useMemo(() => groupSalonsByOwner(salons), [salons]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      <Navbar />

      {/* Page header */}
      <div className="bg-zinc-950 pt-32 pb-16">
        <div className="container text-center">
          <p className="font-script text-gold text-4xl mb-2 -rotate-1">Find Your</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Perfect Salon
          </h1>
          <p className="text-white/55 text-lg max-w-xl mx-auto leading-relaxed">
            Discover elite professionals and luxurious environments.
          </p>
        </div>
      </div>

      <div className="container pt-10 pb-24">
        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 max-w-3xl mx-auto -mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search salons or descriptions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 rounded-2xl border-0 bg-white h-14 shadow-elevated focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:ring-offset-0 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-52 rounded-2xl border-0 bg-white h-14 shadow-elevated focus:ring-2 focus:ring-gold/30 focus:ring-offset-0 text-sm px-4 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-gray-100 shadow-elevated">
              <SelectItem value="all" className="text-sm py-2.5">
                All Locations
              </SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc} className="text-sm py-2.5">
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20 gap-2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading salons…</span>
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-gray-400 text-sm">
            <p>Could not load salons. Check that the API is running.</p>
          </div>
        )}

        {!isLoading && !isError && grouped.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">
            <p>No salons found. Owners must publish a salon before it appears here.</p>
          </div>
        )}

        {!isLoading && !isError && grouped.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {grouped.map((group, i) => (
              <motion.div
                key={group.ownerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <SalonCard
                  group={group}
                  image={group.listingImageUrl ?? PLACEHOLDER_IMAGE}
                  rating={5}
                  priceRange="View pricing"
                  isOpen
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </motion.div>
  );
};

export default Salons;
