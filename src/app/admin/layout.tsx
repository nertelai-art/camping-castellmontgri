import type { Metadata } from "next";
import { body, display } from "../fonts";
import "../globals.css";

// El panell té el seu propi document: no passa pels idiomes de la web ni s'ha d'indexar.
export const metadata: Metadata = {
  title: { default: "Panell · Castell Montgrí", template: "%s · Panell" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="ca" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-svh bg-paper text-ink">{children}</body>
    </html>
  );
}
