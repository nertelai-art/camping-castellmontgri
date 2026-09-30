import { defineRouting } from "next-intl/routing";

// Els mateixos idiomes i prefixos que el web actual (/es, /ca, /fr, /en, /nl),
// perquè les URL que ja té indexades Google continuïn vives.
export const routing = defineRouting({
  locales: ["es", "ca", "fr", "en", "nl"],
  defaultLocale: "es",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
