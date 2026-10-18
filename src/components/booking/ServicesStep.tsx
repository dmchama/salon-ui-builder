import { CheckCircle, GitBranch, Loader2, MapPin, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PromoCodeInfo } from "@/api/bookings-api";
import type { PublicSalonService, SalonBranch } from "@/api/salon-api";
import { cn } from "@/lib/utils";
import { formatDuration, formatLkr } from "@/lib/booking-format";

type Props = {
  branches: SalonBranch[];
  selectedBranchSlug: string;
  onBranchChange: (slug: string) => void;
  services: PublicSalonService[];
  selectedService: string;
  onServiceChange: (id: string) => void;
  promoInput: string;
  onPromoInputChange: (value: string) => void;
  onApplyPromo: () => void;
  isValidatingPromo: boolean;
  promoInfo: PromoCodeInfo | null;
  promoApplies: boolean;
  appliedPromoCode: string;
  promoError: string | null;
};

const ServicesStep = ({
  branches,
  selectedBranchSlug,
  onBranchChange,
  services,
  selectedService,
  onServiceChange,
  promoInput,
  onPromoInputChange,
  onApplyPromo,
  isValidatingPromo,
  promoInfo,
  promoApplies,
  appliedPromoCode,
  promoError,
}: Props) => (
  <div className="space-y-10">
    {branches.length > 1 && (
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Branch</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {branches.map((branch) => {
            const location = [branch.city, branch.country].filter(Boolean).join(", ");
            const isSelected = branch.slug === selectedBranchSlug;
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => onBranchChange(branch.slug)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border bg-white text-left transition-colors",
                  isSelected ? "border-gold ring-2 ring-gold" : "border-gray-200 hover:border-gray-400",
                )}
              >
                <GitBranch className={cn("h-4 w-4 mt-0.5 shrink-0", isSelected ? "text-gold" : "text-gray-400")} />
                <span className="min-w-0">
                  <span className="block font-semibold text-gray-900">{branch.name}</span>
                  {location && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {location}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    )}

    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Service</h2>
      {services.length === 0 ? (
        <p className="text-sm text-gray-500">No bookable services yet. Please contact the salon.</p>
      ) : (
        <div className="flex flex-col gap-3" role="listbox" aria-label="Services">
          {services.map((s) => {
            const isSelected = s.id === selectedService;
            return (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onServiceChange(s.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-4 px-6 py-5 rounded-xl border bg-white text-left transition-colors",
                  isSelected ? "border-gold ring-2 ring-gold" : "border-gray-200 hover:border-gray-400",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-lg text-gray-900">{s.name}</span>
                  <span className="block text-sm text-gray-500">{formatDuration(s.durationMin)}</span>
                </span>
                <span className="shrink-0 text-gray-900">{formatLkr(s.priceCents)}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>

    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Tag className="h-4 w-4 text-gold" /> Promo code
      </h2>
      <div className="flex gap-2">
        <Input
          value={promoInput}
          onChange={(e) => onPromoInputChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onApplyPromo();
            }
          }}
          placeholder="Enter promo code"
          className="rounded-xl border-gray-200 bg-white h-12 px-4 font-mono tracking-wider uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-sans flex-1"
        />
        <Button
          type="button"
          onClick={onApplyPromo}
          disabled={!promoInput.trim() || isValidatingPromo}
          className="rounded-xl h-12 px-5 font-semibold bg-gold/10 text-gold hover:bg-gold/20 shadow-none"
        >
          {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {promoInfo && promoApplies && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 bg-gold/5 border border-gold/20 rounded-xl px-4 py-3 text-sm"
        >
          <CheckCircle className="h-4 w-4 text-gold shrink-0" />
          <span className="font-semibold text-gold">{promoInfo.discountPct}% discount applied</span>
          <span className="text-gray-400 text-xs ml-auto font-mono">{appliedPromoCode}</span>
        </motion.div>
      )}
      {promoInfo && !promoApplies && selectedService && (
        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
          This promo code does not apply to the selected service.
        </div>
      )}
      {promoError && (
        <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
          {promoError}
        </div>
      )}
    </section>
  </div>
);

export default ServicesStep;
