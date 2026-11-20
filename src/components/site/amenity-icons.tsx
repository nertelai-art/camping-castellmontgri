import {
  AirVent,
  Armchair,
  BedDouble,
  BedSingle,
  Car,
  Check,
  CookingPot,
  Droplets,
  Fence,
  Layers,
  PlugZap,
  ShowerHead,
  Sun,
  Toilet,
  Umbrella,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { AmenityIcon, BedKind } from "@/lib/content/equipment";

// Les icones de l'equipament de la pàgina de cada allotjament. Només les fa servir codi de servidor: arriben com a SVG dins l'HTML,
// sense que lucide-react entri al JavaScript del navegador. Quina toca a cada equipament es decideix a `equipment.ts` (amb proves).

const AMENITY: Record<AmenityIcon, LucideIcon> = {
  shower: ShowerHead,
  toilet: Toilet,
  kitchen: CookingPot,
  dishes: UtensilsCrossed,
  bedding: Layers,
  outdoorFurniture: Armchair,
  deckchair: Sun,
  awning: Umbrella,
  terrace: Fence,
  airConditioning: AirVent,
  car: Car,
  water: Droplets,
  electricity: PlugZap,
  check: Check,
};

const BED: Record<BedKind, LucideIcon> = {
  double: BedDouble,
  single: BedSingle,
  bunk: Layers,
};

export function AmenityGlyph({ icon, className }: { icon: AmenityIcon; className?: string }) {
  const Icon = AMENITY[icon];
  return <Icon aria-hidden="true" strokeWidth={1.7} className={className} />;
}

export function BedGlyph({ kind, className }: { kind: BedKind; className?: string }) {
  const Icon = BED[kind];
  return <Icon aria-hidden="true" strokeWidth={1.7} className={className} />;
}
