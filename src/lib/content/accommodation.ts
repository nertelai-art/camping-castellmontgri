// Adreça de la pàgina d'un allotjament. Un sol lloc: la fan servir les targetes, el mapa del web i les altres fitxes.
export const accommodationHref = (locale: string, slug: string) => `/${locale}/accommodations/${slug}`;

// El nom de la transició de vista que fa volar la foto de la targeta a la foto gran de la pàgina (i de tornada). Un per allotjament.
export const accommodationPhotoTransition = (slug: string) => `accommodation-photo-${slug}`;
