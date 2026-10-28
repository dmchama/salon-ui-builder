import { describe, expect, it } from "vitest";
import { STATUS_KINDS, statusBadge } from "./status-styles";

describe("statusBadge (spec 004 AC4)", () => {
  it("gives the same tone to the same meaning across kinds", () => {
    expect(statusBadge("booking", "COMPLETED").tone).toBe("success");
    expect(statusBadge("salon", "PUBLISHED").tone).toBe("success");
    expect(statusBadge("account", "ACTIVE").tone).toBe("success");
    expect(statusBadge("payment", "APPROVED").tone).toBe("success");
    expect(statusBadge("account", "PENDING").tone).toBe("warning");
    expect(statusBadge("payment", "PENDING").tone).toBe("warning");
    expect(statusBadge("salon", "SUSPENDED").tone).toBe("danger");
    expect(statusBadge("payment", "REJECTED").tone).toBe("danger");
    expect(statusBadge("booking", "CANCELLED").tone).toBe("danger");
  });

  it("uses readable sentence-case labels", () => {
    expect(statusBadge("booking", "NO_SHOW").label).toBe("No show");
    expect(statusBadge("subscription", "PAST_DUE").label).toBe("Past due");
    expect(statusBadge("salon", "DRAFT").label).toBe("Draft");
  });

  it("accepts lower-case statuses (admin owners API)", () => {
    expect(statusBadge("account", "pending")).toEqual(statusBadge("account", "PENDING"));
  });

  it("falls back to a neutral badge for unknown statuses", () => {
    expect(statusBadge("booking", "SOMETHING_NEW")).toEqual({ label: "Something new", tone: "neutral" });
  });

  it("covers every known status of every kind", () => {
    for (const [kind, statuses] of Object.entries(STATUS_KINDS)) {
      for (const s of Object.keys(statuses)) {
        const b = statusBadge(kind as keyof typeof STATUS_KINDS, s);
        expect(b.label.length).toBeGreaterThan(0);
      }
    }
  });
});
