import { describe, it, expect } from "vitest";
import type { AvailabilityDay } from "@/api/bookings-api";
import {
  colomboToday,
  dayLabel,
  firstAvailableDate,
  formatSlotLabel,
  isDayDisabled,
  nextAvailableDate,
  toStartAtIso,
} from "./booking-slots";

const day = (date: string, slots: string[], closed = false): AvailabilityDay => ({
  date,
  closed,
  open: closed ? null : "09:00",
  close: closed ? null : "18:00",
  slots,
});

const DAYS = [
  day("2026-10-18", [], true),
  day("2026-10-19", []),
  day("2026-10-20", ["09:00", "09:15"]),
  day("2026-10-21", [], true),
  day("2026-10-22", ["10:00"]),
];

describe("colomboToday", () => {
  it("uses the Colombo date, not the browser's", () => {
    // 20:00 UTC on the 18th is 01:30 on the 19th in Colombo.
    expect(colomboToday(new Date("2026-10-18T20:00:00Z"))).toBe("2026-10-19");
    expect(colomboToday(new Date("2026-10-18T10:00:00Z"))).toBe("2026-10-18");
  });
});

describe("toStartAtIso", () => {
  it("converts a Colombo date + time to UTC ISO", () => {
    expect(toStartAtIso("2026-10-19", "10:30")).toBe("2026-10-19T05:00:00.000Z");
    expect(toStartAtIso("2026-10-19", "03:00")).toBe("2026-10-18T21:30:00.000Z");
  });
});

describe("formatSlotLabel", () => {
  it("formats 12-hour times", () => {
    expect(formatSlotLabel("09:00")).toBe("9:00 AM");
    expect(formatSlotLabel("12:00")).toBe("12:00 PM");
    expect(formatSlotLabel("13:15")).toBe("1:15 PM");
    expect(formatSlotLabel("00:30")).toBe("12:30 AM");
  });
});

describe("dayLabel (AC1)", () => {
  it("returns weekday, day number and month", () => {
    expect(dayLabel("2026-10-19")).toEqual({ weekday: "Mon", day: "19", month: "Oct" });
    expect(dayLabel("2026-11-01")).toEqual({ weekday: "Sun", day: "1", month: "Nov" });
  });
});

describe("isDayDisabled", () => {
  it("disables closed days only (AC4)", () => {
    expect(isDayDisabled(DAYS[0])).toBe(true);
    expect(isDayDisabled(DAYS[1])).toBe(false);
  });
});

describe("firstAvailableDate (AC3)", () => {
  it("returns the first day with a free time", () => {
    expect(firstAvailableDate(DAYS)).toBe("2026-10-20");
  });
  it("returns null when nothing is free", () => {
    expect(firstAvailableDate([DAYS[0], DAYS[1]])).toBeNull();
  });
});

describe("nextAvailableDate (AC10)", () => {
  it("returns the next day after the given one with a free time", () => {
    expect(nextAvailableDate(DAYS, "2026-10-19")).toBe("2026-10-20");
    expect(nextAvailableDate(DAYS, "2026-10-20")).toBe("2026-10-22");
  });
  it("returns null when there is none", () => {
    expect(nextAvailableDate(DAYS, "2026-10-22")).toBeNull();
  });
});
