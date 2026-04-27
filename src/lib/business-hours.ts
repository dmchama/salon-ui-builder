export const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayCode = (typeof DAY_ORDER)[number];

export const DAY_LABELS: Record<DayCode, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export type DayHoursSlot = {
  closed: boolean;
  open: string;
  close: string;
};

export type BusinessHoursState = Record<DayCode, DayHoursSlot>;

export function defaultBusinessHours(): BusinessHoursState {
  return {
    mon: { closed: true, open: "", close: "" },
    tue: { closed: true, open: "", close: "" },
    wed: { closed: true, open: "", close: "" },
    thu: { closed: true, open: "", close: "" },
    fri: { closed: true, open: "", close: "" },
    sat: { closed: true, open: "", close: "" },
    sun: { closed: true, open: "", close: "" },
  };
}

export function mergeBusinessHoursFromApi(raw: unknown): BusinessHoursState {
  const base = defaultBusinessHours();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  for (const day of DAY_ORDER) {
    const row = o[day];
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    base[day] = {
      closed: Boolean(r.closed),
      open: typeof r.open === "string" ? r.open : "",
      close: typeof r.close === "string" ? r.close : "",
    };
  }
  return base;
}

export function businessHoursToJson(state: BusinessHoursState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const day of DAY_ORDER) {
    const s = state[day];
    out[day] = {
      closed: s.closed,
      open: s.open.trim(),
      close: s.close.trim(),
    };
  }
  return out;
}

/** Human-readable lines for public display (skip fully closed-without-times placeholder days if desired) */
export function formatBusinessHoursLines(state: BusinessHoursState): string[] {
  return DAY_ORDER.map((day) => {
    const s = state[day];
    const label = DAY_LABELS[day];
    if (s.closed && !s.open && !s.close) return `${label}: Closed`;
    if (s.closed) return `${label}: Closed`;
    if (s.open && s.close) return `${label}: ${s.open} – ${s.close}`;
    return `${label}: Hours not set`;
  });
}
