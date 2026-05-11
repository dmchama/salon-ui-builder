import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SalonCardProps {
  slug: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  services: string[];
  priceRange: string;
  isOpen: boolean;
}

const SalonCard = ({ slug, name, image, location, rating, priceRange, isOpen }: SalonCardProps) => (
  <Link to={`/salon/${slug}`} className="group block">
    <div className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated hover:-translate-y-1.5 transition-all duration-300">
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
        <div className="flex items-center gap-1.5 text-gray-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="text-sm">{location}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-600">{priceRange}</span>
          <span className="text-xs font-semibold text-gold group-hover:underline underline-offset-2">
            Book Now →
          </span>
        </div>
      </div>
    </div>
  </Link>
);

export default SalonCard;
