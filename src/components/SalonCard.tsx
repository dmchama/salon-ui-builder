import { Link } from "react-router-dom";
import { MapPin, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SalonCardProps {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  services: string[];
  priceRange: string;
  isOpen: boolean;
}

const SalonCard = ({ id, name, image, location, rating, services, priceRange, isOpen }: SalonCardProps) => (
  <Link to={`/salon/${id}`} className="group block">
    <div className="rounded-lg overflow-hidden border bg-card shadow-soft hover:shadow-elevated transition-all duration-300 group-hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 right-3">
          <Badge variant={isOpen ? "default" : "secondary"} className={isOpen ? "bg-emerald-500 text-emerald-50" : ""}>
            {isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-display font-semibold text-card-foreground">{name}</h3>
          <div className="flex items-center gap-1 text-gold">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{rating}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="text-sm">{location}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {services.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1 border-t">
          <span className="text-sm text-muted-foreground">{priceRange}</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">Book Now</span>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

export default SalonCard;
