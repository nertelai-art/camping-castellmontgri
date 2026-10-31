/**
 * L'equipament d'un allotjament, sense el que la fitxa ja ensenya amb icones: les files «etiqueta: valor» del web antic (mida, persones,
 * habitacions; el dos punts és el que les distingeix en tots els idiomes) i les que diuen el mateix que una de les dades (`shown`).
 */
export const equipmentOnly = (features: string[], shown: string[] = []) => {
  const repeated = new Set(shown.map((text) => text.toLowerCase()));
  return features.filter((feature) => !feature.includes(":") && !repeated.has(feature.toLowerCase()));
};
