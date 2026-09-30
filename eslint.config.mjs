import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Cada proveïdor només s'importa des de la seva frontera.
const SUPABASE = { group: ["@supabase/*"], message: "Supabase només s'importa des de src/lib/supabase/" };
const SENTRY = { group: ["@sentry/*"], message: "Sentry només s'importa des de src/lib/monitoring/ i instrumentation*" };
const restrict = (...patterns) => ({ "no-restricted-imports": ["error", { patterns }] });

const boundaries = [
  { files: ["src/**/*.{ts,tsx}"], rules: restrict(SUPABASE, SENTRY) },
  { files: ["src/lib/supabase/**"], rules: restrict(SENTRY) },
  { files: ["src/lib/monitoring/**", "src/instrumentation.ts", "src/instrumentation-client.ts"], rules: restrict(SUPABASE) },
];

const config = [
  ...nextVitals,
  ...nextTs,
  ...boundaries,
  { ignores: [".next/**", "node_modules/**", "reference/**", "next-env.d.ts", "src/lib/supabase/database.types.ts"] },
];

export default config;
