import { describe, expect, it } from "vitest";
import { bookingLink } from "./link";

const ENGINE = "https://engine.witbooking.com/es/property/castellmontgri";

describe("enllaç al motor de reserves", () => {
  it("porta les dates en el format del motor, i les persones", () => {
    expect(bookingLink(ENGINE, { checkIn: "2027-05-10", checkOut: "2027-05-14", adults: 2, children: 1 })).toBe(`${ENGINE}?datein=10-05-2027&dateout=14-05-2027&adults=2&ninos=1`);
  });

  it("obre el motor en l'idioma de la web", () => {
    expect(bookingLink(ENGINE, { locale: "nl" })).toBe("https://engine.witbooking.com/nl/property/castellmontgri");
  });

  it("no envia una data sola: el motor l'ignoraria", () => {
    expect(bookingLink(ENGINE, { checkIn: "2027-05-10", adults: 2 })).toBe(`${ENGINE}?adults=2`);
  });

  it("no envia zero nens", () => {
    expect(bookingLink(ENGINE, { adults: 2, children: 0 })).toBe(`${ENGINE}?adults=2`);
  });

  it("deixa tal qual una adreça que no és la del motor", () => {
    expect(bookingLink("https://altre.example/reserva", { locale: "ca", adults: 2 })).toBe("https://altre.example/reserva");
    expect(bookingLink("no és una adreça", { adults: 2 })).toBe("no és una adreça");
  });
});
