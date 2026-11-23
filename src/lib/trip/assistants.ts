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

/**
 * Les peces que el text de cada assistent (editat al panell) pot portar entre claus. Els noms són en català, com el panell.
 * `{nits}` ja porta la paraula («3 nits», «1 nuit»), perquè el plural depèn de l'idioma.
 */
export const TRIP_PLACEHOLDERS = ["nits", "camping", "lloc", "web", "tipus"] as const;
export type TripPlaceholder = (typeof TRIP_PLACEHOLDERS)[number];

/** Omple el text de l'assistent. Una clau que no és de la llista es deixa tal com està: el panell ja no deixa desar-la. */
export const fillPrompt = (template: string, values: Record<TripPlaceholder, string>) =>
  template.replace(/\{([^{}]+)\}/g, (match, name: string) => (Object.hasOwn(values, name) ? values[name as TripPlaceholder] : match));
