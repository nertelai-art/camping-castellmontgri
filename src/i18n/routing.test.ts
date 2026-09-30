import { describe, expect, it } from "vitest";
import { routing } from "./routing";
import ca from "../../messages/ca.json";
import es from "../../messages/es.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import nl from "../../messages/nl.json";

const messages = { ca, es, en, fr, nl } as const;

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("i18n", () => {
  it("manté els cinc idiomes del web actual", () => {
    expect([...routing.locales].sort()).toEqual(["ca", "en", "es", "fr", "nl"]);
  });

  it("cada idioma té exactament les mateixes claus que l'espanyol", () => {
    const reference = keys(es).sort();
    for (const locale of routing.locales) {
      expect(keys(messages[locale]).sort(), locale).toEqual(reference);
    }
  });
});
