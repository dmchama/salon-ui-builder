/**
 * One badge style per meaning, used everywhere in the owner dashboard and admin panel
 * (spec 004 AC4). Colours for each tone live in components/app-shell/StatusBadge.
 */

export type StatusTone = "success" | "warning" | "danger" | "brand" | "neutral";

export const STATUS_KINDS = {
  booking: { CONFIRMED: "brand", COMPLETED: "success", CANCELLED: "danger", NO_SHOW: "warning" },
  salon: { DRAFT: "neutral", PUBLISHED: "success", SUSPENDED: "danger" },
  account: { PENDING: "warning", ACTIVE: "success", SUSPENDED: "danger" },
  payment: { PENDING: "warning", APPROVED: "success", REJECTED: "danger" },
  campaign: { PENDING: "warning", APPROVED: "success", REJECTED: "danger" },
  invoice: { DRAFT: "neutral", SENT: "brand", PAID: "success", CANCELLED: "neutral" },
  subscription: { ACTIVE: "success", EXPIRED: "neutral", CANCELLED: "neutral", PAST_DUE: "warning" },
} as const satisfies Record<string, Record<string, StatusTone>>;

export type StatusKind = keyof typeof STATUS_KINDS;

function sentenceCase(status: string): string {
  const words = status.toLowerCase().split(/[_\s]+/).filter(Boolean);
  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function statusBadge(kind: StatusKind, status: string): { label: string; tone: StatusTone } {
  const key = status.toUpperCase();
  const tones: Record<string, StatusTone> = STATUS_KINDS[kind];
  return { label: sentenceCase(key), tone: tones[key] ?? "neutral" };
}
