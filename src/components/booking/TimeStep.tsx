import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, Phone, UserRound } from "lucide-react";
import { availabilityQueryKey, fetchAvailability } from "@/api/bookings-api";
import type { PublicSalonTechnician } from "@/api/salon-api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  dateFromIso,
  firstAvailableDate,
  formatDayLong,
  isoFromDate,
  nextAvailableDate,
} from "@/lib/booking-slots";
import DayStrip from "./DayStrip";
import TimeSlotList from "./TimeSlotList";

type Props = {
  salonId: string;
  serviceId: string;
  salonPhone?: string | null;
  technicians: PublicSalonTechnician[];
  technicianId: string;
  onTechnicianChange: (id: string) => void;
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
};

const ANY = "__any__";

/** "Select date and time" step (AC1–AC12, AC18). */
const TimeStep = ({
  salonId,
  serviceId,
  salonPhone,
  technicians,
  technicianId,
  onTechnicianChange,
  date,
  time,
  onDateChange,
  onTimeChange,
}: Props) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: availabilityQueryKey(salonId, serviceId),
    queryFn: () => fetchAvailability(salonId, serviceId),
    staleTime: 30_000,
  });

  const days = useMemo(() => data?.days ?? [], [data]);
  const selectedDay = days.find((d) => d.date === date);

  // Default to the first day with a free time (AC3); also recover if the
  // chosen day disappeared or became closed after a refresh.
  useEffect(() => {
    if (!days.length) return;
    if (!selectedDay || selectedDay.closed) {
      const first = firstAvailableDate(days) ?? days.find((d) => !d.closed)?.date;
      if (first && first !== date) onDateChange(first);
    }
  }, [days, selectedDay, date, onDateChange]);

  // A chosen time that is no longer free is cleared (e.g. after SLOT_TAKEN refresh).
  useEffect(() => {
    if (selectedDay && time && !selectedDay.slots.includes(time)) onTimeChange("");
  }, [selectedDay, time, onTimeChange]);

  const selectedTech = technicians.find((t) => t.id === technicianId);
  const allClosed = days.length > 0 && days.every((d) => d.closed);
  const nextDate = date ? nextAvailableDate(days, date) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        {technicians.length > 0 ? (
          <Select value={technicianId || ANY} onValueChange={(v) => onTechnicianChange(v === ANY ? "" : v)}>
            <SelectTrigger className="w-auto h-12 rounded-full border-gray-200 bg-white pl-2 pr-4 gap-2 text-base [&>svg:last-child]:hidden focus:ring-gold/40">
              <span className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                <UserRound className="h-4 w-4 text-gold" />
              </span>
              <span className="text-gray-900">{selectedTech?.name ?? "Any professional"}</span>
              <ChevronDown className="h-4 w-4 text-gray-900" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value={ANY}>Any professional</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                  {t.specialization ? ` · ${t.specialization}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span />
        )}

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Open calendar"
              disabled={!days.length || allClosed}
              className="w-16 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-900 hover:bg-gray-100 disabled:opacity-40"
            >
              <CalendarDays className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0 rounded-2xl">
            {days.length > 0 && (
              <Calendar
                mode="single"
                selected={date ? dateFromIso(date) : undefined}
                defaultMonth={date ? dateFromIso(date) : undefined}
                fromDate={dateFromIso(days[0].date)}
                toDate={dateFromIso(days[days.length - 1].date)}
                disabled={(d) => {
                  const day = days.find((x) => x.date === isoFromDate(d));
                  return !day || day.closed;
                }}
                onSelect={(d) => {
                  if (!d) return;
                  onDateChange(isoFromDate(d));
                  setCalendarOpen(false);
                }}
                classNames={{
                  day_selected: "bg-gold text-white hover:bg-gold hover:text-white focus:bg-gold focus:text-white",
                }}
              />
            )}
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex gap-3">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="w-20 h-28 rounded-2xl shrink-0" />
            ))}
          </div>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center space-y-3">
          <p className="text-sm text-red-700">Couldn't load available times.</p>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="rounded-full">
            Retry
          </Button>
        </div>
      ) : allClosed ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center space-y-3">
          <p className="text-gray-900 font-medium">
            This salon hasn't published its opening hours yet. Please contact the salon.
          </p>
          {salonPhone && (
            <a href={`tel:${salonPhone}`} className="inline-flex items-center gap-2 text-gold font-semibold hover:underline">
              <Phone className="h-4 w-4" /> {salonPhone}
            </a>
          )}
        </div>
      ) : (
        <>
          <DayStrip days={days} selected={date} onSelect={onDateChange} />

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pick a time</h2>
            {selectedDay && selectedDay.slots.length > 0 ? (
              <TimeSlotList slots={selectedDay.slots} selected={time} onSelect={onTimeChange} />
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center space-y-4">
                <p className="text-gray-700">No available times on this day.</p>
                {nextDate && (
                  <Button
                    variant="outline"
                    onClick={() => onDateChange(nextDate)}
                    className="rounded-full border-gray-300"
                  >
                    Next available: {formatDayLong(nextDate)}
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TimeStep;
