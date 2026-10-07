import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const app = path.resolve(__dirname, "../app");

describe("site icons", () => {
  it("draws the logo mark in the brand green with the marigold line", () => {
    const svg = readFileSync(path.join(app, "icon.svg"), "utf8");
    expect(svg).toContain('viewBox="0 0 32 32"');
    expect(svg).toContain("#1F5A43");
    expect(svg).toContain("#FFCF4A");
  });

  it("ships a favicon.ico and a 180px apple touch icon", () => {
    const ico = readFileSync(path.join(app, "favicon.ico"));
    expect(ico.readUInt16LE(2)).toBe(1); // ICO type
    expect(ico.readUInt16LE(4)).toBeGreaterThanOrEqual(2); // more than one size

    const png = readFileSync(path.join(app, "apple-icon.png"));
    expect(png.readUInt32BE(16)).toBe(180);
    expect(png.readUInt32BE(20)).toBe(180);
  });
});
