import { formatSlotLabel } from "@/lib/booking-slots";
import { cn } from "@/lib/utils";

type Props = {
  slots: string[];
  selected: string;
  onSelect: (slot: string) => void;
};

/** Full-width time cards (AC6, AC11). */
const TimeSlotList = ({ slots, selected, onSelect }: Props) => (
  <div className="flex flex-col gap-3" role="listbox" aria-label="Available times">
    {slots.map((slot) => {
      const isSelected = slot === selected;
      return (
        <button
          key={slot}
          type="button"
          role="option"
          aria-selected={isSelected}
          onClick={() => onSelect(slot)}
          className={cn(
            "w-full text-left px-7 py-5 rounded-xl border bg-white text-lg text-gray-900 transition-colors",
            isSelected ? "border-gold ring-2 ring-gold bg-gold/5 font-semibold" : "border-gray-200 hover:border-gray-400",
          )}
        >
          {formatSlotLabel(slot)}
        </button>
      );
    })}
  </div>
);

export default TimeSlotList;
