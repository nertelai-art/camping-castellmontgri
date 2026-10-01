import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { refreshSession } from "./lib/supabase/proxy";

const intl = createMiddleware(routing);

// El panell no té idiomes a l'URL: només cal mantenir-hi viva la sessió. La resta és la web pública.
export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) return refreshSession(request);
  return intl(request);
}

export const config = {
  // Tot menys l'API, els interns de Next i els fitxers amb extensió.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
