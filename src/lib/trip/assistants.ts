// Els assistents on es pot obrir el pla de viatge. ChatGPT i Claude accepten el text a l'adreça; Gemini no: s'obre i es copia abans.

export type AssistantKey = "chatgpt" | "claude" | "gemini";
export type Assistant = { key: AssistantKey; name: string; href: (prompt: string) => string; needsCopy: boolean };

export const ASSISTANTS: [Assistant, ...Assistant[]] = [
  { key: "chatgpt", name: "ChatGPT", href: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, needsCopy: false },
  { key: "claude", name: "Claude", href: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`, needsCopy: false },
  { key: "gemini", name: "Gemini", href: () => "https://gemini.google.com/app", needsCopy: true },
];

export const TRIP_TYPES = ["family", "adventure", "romantic", "culture"] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const MIN_NIGHTS = 1;
export const MAX_NIGHTS = 14;
export const clampNights = (nights: number) => Math.min(MAX_NIGHTS, Math.max(MIN_NIGHTS, nights));
