import { describe, expect, it } from "vitest";
import { sportsSvg } from "./map-sports";

describe("sportsSvg", () => {
  it("porta cada pista al seu paral·lelogram amb una matriu afí", () => {
    const svg = sportsSvg([{ type: "tennis", tl: [100, 200], tr: [140, 204], bl: [90, 280] }], 3000, 1845);
    expect(svg).toContain('width="3000" height="1845"');
    // u = tr − tl, v = bl − tl, origen a tl
    expect(svg).toContain('transform="matrix(40 4 -10 80 100 200)"');
  });

  it("el gruix de línia compensa l'escala: pista petita, traç relatiu més gros", () => {
    const small = sportsSvg([{ type: "basket", tl: [0, 0], tr: [30, 0], bl: [0, 60] }], 100, 100);
    const big = sportsSvg([{ type: "basket", tl: [0, 0], tr: [300, 0], bl: [0, 600] }], 1000, 1000);
    expect(small).toContain('stroke-width="0.05"');
    expect(big).toContain('stroke-width="0.005"');
  });

  it("les pistes es pinten en l'ordre donat (la base verda primer)", () => {
    const svg = sportsSvg(
      [
        { type: "apron", tl: [0, 0], tr: [10, 0], bl: [0, 10] },
        { type: "football", tl: [1, 1], tr: [9, 1], bl: [1, 9] },
      ],
      10,
      10,
    );
    expect(svg.indexOf("#4c9f63")).toBeLessThan(svg.indexOf("#2f6b3a"));
  });
});
