import { describe, expect, it } from "vitest";
import { cloudinaryThumb, initials } from "./team-avatar";

describe("initials (spec 005 Q1)", () => {
  it("uses first and last name initials", () => {
    expect(initials("Ishara Silva")).toBe("IS");
    expect(initials("  nadeesha  de silva ")).toBe("NS");
    expect(initials("Dilini")).toBe("D");
    expect(initials("")).toBe("?");
  });
});

describe("cloudinaryThumb (spec 005 AC13)", () => {
  const url = "https://res.cloudinary.com/demo/image/upload/v1712/technician-photos/abc.jpg";

  it("adds a face-centred square crop at 2x the display size", () => {
    expect(cloudinaryThumb(url, 56)).toBe(
      "https://res.cloudinary.com/demo/image/upload/c_fill,g_face,w_112,h_112,q_auto,f_auto/v1712/technician-photos/abc.jpg",
    );
  });

  it("leaves non-Cloudinary URLs unchanged", () => {
    expect(cloudinaryThumb("https://example.com/me.jpg", 56)).toBe("https://example.com/me.jpg");
  });
});
