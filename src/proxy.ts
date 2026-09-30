import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Tot menys l'API, l'admin, els interns de Next i els fitxers amb extensió.
  matcher: "/((?!api|admin|_next|_vercel|.*\..*).*)",
};
