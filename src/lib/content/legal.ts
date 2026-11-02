// Les pàgines legals: el text és contingut (una secció del panell cadascuna), l'adreça i on surten, aquí.

export const LEGAL_PAGES = {
  privacy: "legal-privacy",
  cookies: "legal-cookies",
  "legal-notice": "legal-notice",
  "booking-conditions": "legal-booking",
} as const;

export type LegalSlug = keyof typeof LEGAL_PAGES;

export const isLegalSlug = (slug: string): slug is LegalSlug => Object.hasOwn(LEGAL_PAGES, slug);
