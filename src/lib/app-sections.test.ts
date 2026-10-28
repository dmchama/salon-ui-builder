import { describe, expect, it } from "vitest";
import { ADMIN_SECTIONS, OWNER_SECTIONS, resolveSection, resolveSubTab, sectionPath } from "./app-sections";

describe("app sections (spec 004 AC6, AC9)", () => {
  it("lists the owner and admin sections from the spec", () => {
    expect(OWNER_SECTIONS.map((s) => s.id)).toEqual([
      "overview", "bookings", "profile", "services", "team", "marketing", "settings",
    ]);
    expect(ADMIN_SECTIONS.map((s) => s.id)).toEqual([
      "overview", "accounts", "salons", "plans", "billing", "marketing", "website",
    ]);
  });

  it("resolves a URL section, defaulting to overview for missing or unknown ones", () => {
    expect(resolveSection(OWNER_SECTIONS, "bookings").id).toBe("bookings");
    expect(resolveSection(OWNER_SECTIONS, undefined).id).toBe("overview");
    expect(resolveSection(OWNER_SECTIONS, "nope").id).toBe("overview");
  });

  it("builds paths with overview at the area root", () => {
    expect(sectionPath("dashboard", "overview")).toBe("/dashboard");
    expect(sectionPath("dashboard", "bookings")).toBe("/dashboard/bookings");
    expect(sectionPath("admin", "accounts")).toBe("/admin/accounts");
  });

  it("resolves marketing sub-tabs with a default", () => {
    const owner = resolveSection(OWNER_SECTIONS, "marketing");
    expect(owner.subTabs?.map((t) => t.id)).toEqual(["sms", "coupons"]);
    expect(resolveSubTab(owner, "coupons")).toBe("coupons");
    expect(resolveSubTab(owner, null)).toBe("sms");
    const admin = resolveSection(ADMIN_SECTIONS, "marketing");
    expect(admin.subTabs?.map((t) => t.id)).toEqual(["campaigns", "promotions", "coupons"]);
    expect(resolveSubTab(admin, "bogus")).toBe("campaigns");
  });

  it("returns undefined sub-tab for sections without sub-tabs", () => {
    expect(resolveSubTab(resolveSection(OWNER_SECTIONS, "bookings"), "x")).toBeUndefined();
  });
});
