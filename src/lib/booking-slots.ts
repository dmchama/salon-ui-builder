import type { AvailabilityDay } from "@/api/bookings-api";

/** Asia/Colombo is UTC+05:30 all year (Sri Lanka has no DST). */
const COLOMBO_OFFSET_MIN = 330;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today's date (YYYY-MM-DD) in Colombo, whatever the browser's timezone. */
export function colomboToday(now: Date = new Date()): string {
  return new Date(now.getTime() + COLOMBO_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}

/** Colombo date + "HH:mm" → UTC ISO string for the booking API. */
export function toStartAtIso(date: string, hhmm: string): string {
  return new Date(`${date}T${hhmm}:00+05:30`).toISOString();
}

/** "13:15" → "1:15 PM" */
export function formatSlotLabel(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Date parts for the day strip: { weekday: "Mon", day: "19", month: "Oct" } */
export function dayLabel(date: string): { weekday: string; day: string; month: string } {
  const [y, mo, d] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(y, mo - 1, d));
  return { weekday: WEEKDAYS[utc.getUTCDay()], day: String(d), month: MONTHS[mo - 1] };
}

/** "Mon, 19 Oct" */
export function formatDayLong(date: string): string {
  const { weekday, day, month } = dayLabel(date);
  return `${weekday}, ${day} ${month}`;
}

/** YYYY-MM-DD → local-midnight Date (for the calendar widget, which works in local dates). */
export function dateFromIso(date: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

/** Local Date from the calendar widget → YYYY-MM-DD. */
export function isoFromDate(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Closed days cannot be selected (AC4). Open days with no free time stay selectable (AC10). */
export function isDayDisabled(day: AvailabilityDay): boolean {
  return day.closed;
}

export function firstAvailableDate(days: AvailabilityDay[]): string | null {
  return days.find((d) => d.slots.length > 0)?.date ?? null;
}

export function nextAvailableDate(days: AvailabilityDay[], after: string): string | null {
  return days.find((d) => d.date > after && d.slots.length > 0)?.date ?? null;
}
