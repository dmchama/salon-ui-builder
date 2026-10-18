import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AvailabilityDay } from "@/api/bookings-api";
import { dayLabel, isDayDisabled } from "@/lib/booking-slots";
import { cn } from "@/lib/utils";

type Props = {
  days: AvailabilityDay[];
  selected: string;
  onSelect: (date: string) => void;
};

/** Horizontally scrolling day cards with page arrows (AC1, AC2, AC4). */
const DayStrip = ({ days, selected, onSelect }: Props) => {
  const scroller = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows, days.length]);

  // Keep the selected day in view (e.g. after picking from the calendar).
  useEffect(() => {
    const strip = scroller.current;
    const el = strip?.querySelector<HTMLElement>(`[data-date="${selected}"]`);
    if (!strip || !el) return;
    const left = el.offsetLeft - strip.offsetLeft;
    const visible = left >= strip.scrollLeft && left + el.offsetWidth <= strip.scrollLeft + strip.clientWidth;
    if (!visible) {
      strip.scrollTo({ left: left - (strip.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
    }
  }, [selected]);

  const page = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Select a date</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={!canPrev}
            aria-label="Previous days"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={!canNext}
            aria-label="Next days"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        onScroll={updateArrows}
        className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="listbox"
        aria-label="Dates"
      >
        {days.map((day) => {
          const { weekday, day: num, month } = dayLabel(day.date);
          const disabled = isDayDisabled(day);
          const isSelected = day.date === selected;
          return (
            <button
              key={day.date}
              type="button"
              role="option"
              aria-selected={isSelected}
              data-date={day.date}
              disabled={disabled}
              onClick={() => onSelect(day.date)}
              title={disabled ? "Closed" : undefined}
              className={cn(
                "shrink-0 w-[72px] sm:w-20 py-3 rounded-2xl border flex flex-col items-center gap-0.5 transition-colors",
                isSelected
                  ? "bg-gold border-gold text-white"
                  : "bg-white border-gray-200 text-gray-900 hover:border-gray-400",
                disabled && "bg-gray-100 border-gray-100 text-gray-300 hover:border-gray-100 cursor-not-allowed",
              )}
            >
              <span className={cn("text-sm", !isSelected && !disabled && "text-gray-500")}>{weekday}</span>
              <span className="text-2xl font-bold leading-tight">{num}</span>
              <span className={cn("text-sm", !isSelected && !disabled && "text-gray-500")}>
                {disabled ? "Closed" : month}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DayStrip;
