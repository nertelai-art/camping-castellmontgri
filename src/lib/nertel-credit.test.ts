import { describe, expect, it } from "vitest";
import { nertelCreditUrl } from "./nertel-credit";

// La franja «Web feta per Nertel» del peu porta a nertel.ai en l'idioma de la pàgina, i marca d'on ve la
// visita perquè a l'analítica de nertel.ai es vegi quines webs de clients ens envien gent.
describe("enllaç de crèdit a Nertel", () => {
  it("porta a nertel.ai en l'idioma de la pàgina", () => {
    for (const locale of ["ca", "es", "en", "fr"]) {
      expect(new URL(nertelCreditUrl(locale)).pathname, locale).toBe(`/${locale}`);
    }
    expect(new URL(nertelCreditUrl("es")).origin).toBe("https://nertel.ai");
  });

  it("porta a l'anglès un idioma que nertel.ai no té", () => {
    expect(new URL(nertelCreditUrl("nl")).pathname).toBe("/en");
  });

  it("diu que la visita ve del peu de la web del càmping", () => {
    const params = new URL(nertelCreditUrl("ca")).searchParams;
    expect(params.get("utm_source")).toBe("camping-castellmontgri.vercel.app");
    expect(params.get("utm_medium")).toBe("credit");
  });
});
