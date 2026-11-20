import { describe, expect, it } from "vitest";
import { platformInitial, reviewBrand } from "./review-platforms";

describe("plataforma de cada nota", () => {
  it.each([
    ["Google", "google"],
    ["Google Maps", "google"],
    ["TripAdvisor", "tripadvisor"],
    ["Trip Advisor", "tripadvisor"],
    ["Tripadvisor.es", "tripadvisor"],
    ["Booking.com", "booking"],
    ["booking", "booking"],
    ["Campings.com", "campings"],
  ] as const)("«%s» → %s", (name, brand) => {
    expect(reviewBrand(name)).toBe(brand);
  });

  it("un nom que no coneix no té logo", () => {
    expect(reviewBrand("Zoover")).toBeNull();
    // «Camping.info» no és Campings.com.
    expect(reviewBrand("Camping.info")).toBeNull();
  });

  it("la insígnia porta la primera lletra en majúscula", () => {
    expect(platformInitial("zoover")).toBe("Z");
    expect(platformInitial("  ¡ANWB")).toBe("A");
  });
});
