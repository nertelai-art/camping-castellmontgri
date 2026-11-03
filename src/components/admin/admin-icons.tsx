// Les icones del panell (lucide-react, només al panell: la web no les carrega). `nav.ts` diu quina toca a cada opció pel nom.

import {
  BedDouble,
  CalendarDays,
  ConciergeBell,
  Cookie,
  FileText,
  History,
  House,
  Images,
  LayoutTemplate,
  MapPin,
  Mountain,
  PartyPopper,
  Quote,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  Type,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import type { NavIcon } from "@/lib/admin/nav";

const ICONS: Record<NavIcon, LucideIcon> = {
  home: House,
  layout: LayoutTemplate,
  quote: Quote,
  "map-pin": MapPin,
  pool: Waves,
  party: PartyPopper,
  utensils: UtensilsCrossed,
  mountain: Mountain,
  images: Images,
  text: Type,
  bed: BedDouble,
  tags: Tags,
  calendar: CalendarDays,
  store: Store,
  sparkles: Sparkles,
  concierge: ConciergeBell,
  shield: ShieldCheck,
  cookie: Cookie,
  scale: Scale,
  file: FileText,
  settings: Settings,
  history: History,
};

export function AdminIcon({ name, ...props }: { name: NavIcon } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" strokeWidth={1.75} {...props} />;
}
