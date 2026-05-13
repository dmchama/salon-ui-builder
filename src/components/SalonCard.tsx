import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SalonGroup } from "@/api/search-api";

interface SalonCardProps {
  group: SalonGroup;
  image: string;
  rating: number;
  priceRange: string;
  isOpen: boolean;
}

const SalonCard = ({ group, image, rating, priceRange, isOpen }: SalonCardProps) => {
  const { name, primarySlug, branches } = group;
  const multipleLocations = branches.length > 1;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
      {/* Clickable top area → salon detail */}
      <Link to={`/salon/${primarySlug}`} className="block flex-1">
        <div className="relative h-52 overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute top-3 right-3">
            <Badge
              className={
                isOpen
                  ? "bg-emerald-500/90 text-white text-[10px] rounded-full px-2.5 py-0.5 font-semibold border-none backdrop-blur-sm"
                  : "bg-black/50 text-white text-[10px] rounded-full px-2.5 py-0.5 font-semibold border-none backdrop-blur-sm"
              }
            >
              {isOpen ? "Open" : "Closed"}
            </Badge>
          </div>
          {multipleLocations && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-black/55 text-white text-[10px] rounded-full px-2.5 py-1 font-semibold backdrop-blur-sm">
                {branches.length} branches
              </span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-base tracking-tight text-gray-900 group-hover:text-gold transition-colors leading-snug">
              {name}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              <span className="text-sm font-semibold text-gray-800">{rating}</span>
            </div>
          </div>

          {multipleLocations ? (
            <div className="flex flex-wrap gap-1.5">
              {branches.map((b) => (
                <span
                  key={b.slug}
                  className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded-full font-medium"
                >
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  {b.city ?? "Location"}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-400">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="text-sm">
                {[branches[0]?.city, branches[0]?.country].filter(Boolean).join(", ") || "Location on profile"}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Bottom action bar — separate from salon detail link */}
      <div className="flex items-center justify-between px-5 pb-5 pt-3 border-t border-gray-100">
        <span className="text-sm font-medium text-gray-600">{priceRange}</span>
        <Link
          to={`/booking/${primarySlug}`}
          className="text-xs font-semibold text-gold hover:underline underline-offset-2"
        >
          Book Now →
        </Link>
      </div>
    </div>
  );
};

export default SalonCard;
