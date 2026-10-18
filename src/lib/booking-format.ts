/** Display + validation helpers for the booking wizard (feature 001). */

/** 60 → "1 hr", 45 → "45 min", 90 → "1 hr 30 min" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/** 750000 cents → "LKR 7,500" */
export function formatLkr(cents: number): string {
  return `LKR ${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export function validatePhone(v: string) {
  return /^[+\d][\d\s\-()]{6,19}$/.test(v.trim());
}
export function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
export function validateName(v: string) {
  return v.trim().length >= 2;
}
