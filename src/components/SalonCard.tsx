import { Link } from "react-router-dom";
import { MapPin, Star, Clock } from "lucide-react";
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

const SalonCard = ({ slug, name, image, location, rating, services, priceRange, isOpen }: SalonCardProps) => (
  <Link to={`/salon/${slug}`} className="group block">
    <div className="bg-transparent transition-all duration-300">
      <div className="relative h-64 overflow-hidden mb-4">
        <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />
        <div className="absolute top-3 right-3">
          <Badge variant={isOpen ? "default" : "secondary"} className={isOpen ? "bg-emerald-500 text-emerald-50 uppercase tracking-widest text-[10px] rounded-none px-2 py-1" : "bg-black/50 text-white uppercase tracking-widest text-[10px] rounded-none px-2 py-1 border-none"}>
            {isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </div>
      <div className="space-y-3 px-1">
        <div className="flex items-start justify-between">
          <h3 className="font-display font-bold text-lg uppercase tracking-widest text-current group-hover:text-gold transition-colors">{name}</h3>
          <div className="flex items-center gap-1 text-gold">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-bold">{rating}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-70">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-light uppercase tracking-wider">{location}</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-current/10 mt-3">
          {services.slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] font-bold uppercase tracking-widest opacity-50">{s}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-bold opacity-90">{priceRange}</span>
          <div className="flex items-center gap-1 text-gold">
            <span className="text-xs font-bold uppercase tracking-widest hover:underline underline-offset-4">Book Now</span>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

export default SalonCard;
