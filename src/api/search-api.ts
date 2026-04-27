import { apiRequest } from "./http";

/** Published salon row from GET /search/salons */
export type PublishedSalonListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: string;
};

export async function fetchPublishedSalons(params: { q?: string; city?: string } = {}) {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.city?.trim() && params.city !== "all") search.set("city", params.city.trim());
  const qs = search.toString();
  return apiRequest<PublishedSalonListItem[]>(`/search/salons${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}
