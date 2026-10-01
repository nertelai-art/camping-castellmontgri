import { describe, expect, it } from "vitest";
import { ICON_ATLAS, iconStyle, isMapIcon, MAP_ICONS } from "./icons";

describe("icones del mapa", () => {
  it("omplen exactament la graella de l'atles i no es repeteixen", () => {
    expect(MAP_ICONS).toHaveLength(ICON_ATLAS.cols * ICON_ATLAS.rows);
    expect(new Set(MAP_ICONS).size).toBe(MAP_ICONS.length);
  });

  it("situa cada icona a la seva cel·la", () => {
    expect(iconStyle("reception").backgroundPosition).toBe("0% 0%");
    expect(iconStyle("supermarket").backgroundPosition).toBe("100% 0%");
    expect(iconStyle("laundry").backgroundPosition).toBe("0% 50%");
    expect(iconStyle("viewpoint").backgroundPosition).toBe("100% 100%");
  });

  it("reconeix quines claus són icones", () => {
    expect(isMapIcon("pool")).toBe(true);
    expect(isMapIcon("unicorn")).toBe(false);
    expect(isMapIcon(null)).toBe(false);
  });
});
