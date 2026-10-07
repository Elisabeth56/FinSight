import { describe, expect, it } from "vitest";

import { displayName, initials } from "@/lib/profile";

describe("initials", () => {
  it("takes the first and last name's letters", () => {
    expect(initials("Adaeze Okafor", "a@x.com")).toBe("AO");
    expect(initials("  ada  chioma obi ", "a@x.com")).toBe("AO");
  });

  it("uses one letter for one name, and the email when there's no name", () => {
    expect(initials("Ada", "a@x.com")).toBe("A");
    expect(initials(null, "kemi@x.com")).toBe("K");
    expect(initials("   ", "kemi@x.com")).toBe("K");
  });
});

describe("displayName", () => {
  it("falls back to the email's local part", () => {
    expect(displayName("Ada Obi", "a@x.com")).toBe("Ada Obi");
    expect(displayName(null, "kemi.a@x.com")).toBe("kemi.a");
  });
});
