import { describe, expect, it } from "vitest";
import { directionsUrl, formatDayMonth } from "./format";

describe("format", () => {
  it("escriu el dia i el mes en l'idioma de la pàgina", () => {
    expect(formatDayMonth("2026-04-27", "ca")).toBe("27 d’abril");
    expect(formatDayMonth("2026-09-27", "es")).toBe("27 de septiembre");
    expect(formatDayMonth("2026-09-27", "nl")).toBe("27 september");
  });

  it("no es mou de dia segons la zona horària", () => {
    expect(formatDayMonth("2026-01-01", "en")).toBe("January 1");
  });

  it("fa un enllaç d'indicacions de Google Maps", () => {
    expect(directionsUrl(42.05, 3.18)).toBe("https://www.google.com/maps/dir/?api=1&destination=42.05,3.18");
  });
});
