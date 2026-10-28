/** Shared formatting for the admin panel (overview and billing). */

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtLkr(cents: number) {
  return `Rs. ${(cents / 100).toLocaleString("en-LK")}`;
}
