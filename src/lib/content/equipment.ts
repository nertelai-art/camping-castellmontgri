/**
 * L'equipament d'un allotjament, sense les files «etiqueta: valor» (mida, persones, habitacions), que vénen del web antic
 * i repeteixen les dades que la fitxa ja ensenya amb icones. El dos punts és el que les distingeix en tots els idiomes.
 */
export const equipmentOnly = (features: string[]) => features.filter((feature) => !feature.includes(":"));
