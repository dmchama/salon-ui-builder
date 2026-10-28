/** Sections of the owner dashboard and admin panel; the section id is part of the URL (spec 004). */

export type SubTab = { id: string; label: string };

export type SectionDef = {
  id: string;
  label: string;
  description: string;
  group: "main" | "manage" | "grow" | "account";
  subTabs?: SubTab[];
};

export const OWNER_SECTIONS: SectionDef[] = [
  { id: "overview", label: "Overview", description: "Your salon at a glance.", group: "main" },
  { id: "bookings", label: "Bookings", description: "Upcoming and past appointments.", group: "main" },
  { id: "profile", label: "Salon profile", description: "Details, hours, photos and publishing.", group: "manage" },
  { id: "services", label: "Services", description: "What guests can book, with prices and durations.", group: "manage" },
  { id: "team", label: "Team", description: "Technicians guests can choose.", group: "manage" },
  {
    id: "marketing",
    label: "Marketing",
    description: "SMS campaigns and coupons for your customers.",
    group: "grow",
    subTabs: [
      { id: "sms", label: "SMS campaigns" },
      { id: "coupons", label: "Coupons" },
    ],
  },
  { id: "settings", label: "Settings", description: "Account preferences.", group: "account" },
];

export const ADMIN_SECTIONS: SectionDef[] = [
  { id: "overview", label: "Overview", description: "Platform activity at a glance.", group: "main" },
  { id: "accounts", label: "Accounts", description: "Salon owners, payments and approvals.", group: "main" },
  { id: "salons", label: "Salons", description: "Publish, suspend or return salons to draft.", group: "manage" },
  { id: "plans", label: "Plans", description: "Subscription plans and limits.", group: "manage" },
  { id: "billing", label: "Billing", description: "Overage pricing and invoices.", group: "manage" },
  {
    id: "marketing",
    label: "Marketing",
    description: "Campaign requests, promotions and coupons.",
    group: "grow",
    subTabs: [
      { id: "campaigns", label: "Campaign requests" },
      { id: "promotions", label: "Promotions" },
      { id: "coupons", label: "Coupons" },
    ],
  },
  { id: "website", label: "Website", description: "Homepage, footer, SEO and payment details.", group: "account" },
];

export function resolveSection(sections: SectionDef[], param: string | undefined): SectionDef {
  return sections.find((s) => s.id === param) ?? sections[0];
}

export function resolveSubTab(section: SectionDef, param: string | null | undefined): string | undefined {
  if (!section.subTabs) return undefined;
  return section.subTabs.find((t) => t.id === param)?.id ?? section.subTabs[0].id;
}

export function sectionPath(area: "dashboard" | "admin", id: string): string {
  return id === "overview" ? `/${area}` : `/${area}/${id}`;
}
