import { apiRequest } from "./http";

/** Published salon row from GET /search/salons */
export type PublishedSalonListItem = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  coverImageUrl: string | null;
  listingImageUrl: string | null;
  status: string;
  isDefault: boolean;
};

export type SalonGroup = {
  ownerId: string;
  /** Derived common brand name (longest shared word prefix across branches) */
  name: string;
  /** Slug of the first/primary branch — used for linking */
  primarySlug: string;
  /** Listing image URL from the primary branch — shown on cards */
  listingImageUrl: string | null;
  branches: { name: string; slug: string; city: string | null; country: string | null }[];
};

function deriveBrandName(names: string[]): string {
  if (names.length === 1) return names[0];
  const splitNames = names.map((n) => n.split(" "));
  const first = splitNames[0];
  let commonLen = 0;
  for (let i = 0; i < first.length; i++) {
    if (splitNames.every((n) => n[i] === first[i])) commonLen = i + 1;
    else break;
  }
  return commonLen > 0 ? first.slice(0, commonLen).join(" ") : names[0];
}

export function groupSalonsByOwner(salons: PublishedSalonListItem[]): SalonGroup[] {
  const map = new Map<string, SalonGroup>();
  for (const salon of salons) {
    if (!map.has(salon.ownerId)) {
      map.set(salon.ownerId, {
        ownerId: salon.ownerId,
        name: salon.name,
        primarySlug: salon.slug,
        listingImageUrl: salon.listingImageUrl,
        branches: [],
      });
    }
    const group = map.get(salon.ownerId)!;
    group.branches.push({
      name: salon.name,
      slug: salon.slug,
      city: salon.city,
      country: salon.country,
    });
    // Promote default branch to primarySlug and use its listing image
    if (salon.isDefault) {
      group.primarySlug = salon.slug;
      group.listingImageUrl = salon.listingImageUrl;
    }
  }
  for (const group of map.values()) {
    group.name = deriveBrandName(group.branches.map((b) => b.name));
  }
  return Array.from(map.values());
}

export async function fetchPublishedSalons(params: { q?: string; city?: string } = {}) {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.city?.trim() && params.city !== "all") search.set("city", params.city.trim());
  const qs = search.toString();
  return apiRequest<PublishedSalonListItem[]>(`/search/salons${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}
