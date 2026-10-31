// Els assistents on es pot obrir el pla de viatge. ChatGPT i Claude accepten el text a l'adreça; Gemini no: s'obre i es copia abans.

export type Assistant = { name: string; href: (prompt: string) => string; needsCopy: boolean };

export const ASSISTANTS: Assistant[] = [
  { name: "ChatGPT", href: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, needsCopy: false },
  { name: "Claude", href: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`, needsCopy: false },
  { name: "Gemini", href: () => "https://gemini.google.com/app", needsCopy: true },
];

export const TRIP_TYPES = ["family", "adventure", "romantic", "culture"] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const MIN_NIGHTS = 1;
export const MAX_NIGHTS = 14;
export const clampNights = (nights: number) => Math.min(MAX_NIGHTS, Math.max(MIN_NIGHTS, nights));
