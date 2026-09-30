import { Fraunces, Lato } from "next/font/google";

// Lato és la tipografia del web actual (continuïtat de marca). Fraunces, una serif «suau»,
// posa la veu de guia de natura als titulars i lliga amb el traç arrodonit del logo.
// Pes: només l'eix SOFT i sense cursiva (amb cursiva i «opsz» eren ~260 KB i endarrerien el LCP a mòbil).
export const display = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT"],
  variable: "--font-display",
  display: "swap",
});

export const body = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
});
