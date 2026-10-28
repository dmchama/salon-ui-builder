import TeamAvatar from "@/components/TeamAvatar";
import { ArrowRight, Loader2, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicSalonDetail, PublicSalonService } from "@/api/salon-api";
import { formatDayLong, formatSlotLabel } from "@/lib/booking-slots";
import { formatDuration, formatLkr } from "@/lib/booking-format";

type Props = {
  salon: PublicSalonDetail;
  service?: PublicSalonService;
  /** Technician name, or undefined for "any professional". */
  professionalName?: string;
  /** Technician photo (feature 005). */
  professionalPhotoUrl?: string | null;
  discountPct?: number;
  date?: string;
  time?: string;
  continueLabel: string;
  continueDisabled: boolean;
  loading?: boolean;
  onContinue: () => void;
};

/** Sticky summary card on desktop, bottom bar on mobile (AC13, AC14). */
const BookingSummary = ({
  salon,
  service,
  professionalName,
  professionalPhotoUrl,
  discountPct,
  date,
  time,
  continueLabel,
  continueDisabled,
  loading,
  onContinue,
}: Props) => {
  const image = salon.listingImageUrl || salon.coverImageUrl;
  const location = [salon.address, salon.city].filter(Boolean).join(", ");
  const price = service?.priceCents ?? 0;
  const discount = discountPct ? Math.round((price * discountPct) / 100) : 0;
  const total = price - discount;

  const continueButton = (className: string) => (
    <Button
      type="button"
      onClick={onContinue}
      disabled={continueDisabled || loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          {continueLabel} <ArrowRight className="h-5 w-5 ml-1" />
        </>
      )}
    </Button>
  );

  return (
    <>
      {/* Desktop card */}
      <div className="hidden lg:flex flex-col sticky top-8 bg-white rounded-3xl border border-gray-200 p-8 min-h-[560px]">
        <div className="flex gap-4 pb-6 border-b border-gray-200">
          {image ? (
            <img src={image} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
              <Scissors className="h-6 w-6 text-gold" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-lg leading-snug">{salon.name}</p>
            {location && <p className="text-sm text-gray-500 mt-1">{location}</p>}
          </div>
        </div>

        {service ? (
          <div className="py-6 border-b border-gray-200 space-y-1">
            <div className="flex justify-between gap-4">
              <p className="text-gray-900">{service.name}</p>
              <p className="text-gray-900 shrink-0">{formatLkr(price)}</p>
            </div>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
              {formatDuration(service.durationMin)} with
              {professionalName && <TeamAvatar name={professionalName} photoUrl={professionalPhotoUrl} size={24} />}
              <span className="text-gold-strong">{professionalName ?? "any professional"}</span>
            </p>
            {date && time && (
              <p className="text-sm text-gray-500">
                {formatDayLong(date)} · {formatSlotLabel(time)}
              </p>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm text-gold pt-2">
                <span>Promo {discountPct}% off</span>
                <span>− {formatLkr(discount)}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="py-6 border-b border-gray-200 text-sm text-gray-400">No service selected</p>
        )}

        <div className="flex justify-between py-6 font-semibold text-lg text-gray-900">
          <span>Total</span>
          <span>{service ? formatLkr(total) : "—"}</span>
        </div>

        <div className="mt-auto">
          {continueButton(
            "w-full h-14 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-lg font-semibold disabled:bg-gray-400 disabled:opacity-100",
          )}
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">{service ? formatLkr(total) : "—"}</p>
          {service && (
            <p className="text-xs text-gray-500 truncate">
              {service.name}
              {date && time ? ` · ${formatDayLong(date)} ${formatSlotLabel(time)}` : ""}
            </p>
          )}
        </div>
        {continueButton(
          "h-12 px-6 rounded-full bg-gray-900 hover:bg-gray-800 text-white font-semibold disabled:bg-gray-400 disabled:opacity-100",
        )}
      </div>
    </>
  );
};

export default BookingSummary;
