import { describe, expect, it } from "vitest";
import { fitWithin, jpegSize } from "./image";

/** Un JPEG mínim: SOI, un segment APP0 i el SOF amb la mida. */
const jpeg = (width: number, height: number, sof = 0xc0) =>
  new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46,
    0xff, sof, 0x00, 0x11, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);

describe("imatges del panell", () => {
  it("redueix al costat llarg màxim i conserva la proporció", () => {
    expect(fitWithin({ width: 4000, height: 3000 }, 2400)).toEqual({ width: 2400, height: 1800 });
    expect(fitWithin({ width: 3000, height: 4000 }, 2400)).toEqual({ width: 1800, height: 2400 });
  });

  it("no amplia mai una imatge petita", () => {
    expect(fitWithin({ width: 800, height: 600 }, 2400)).toEqual({ width: 800, height: 600 });
  });

  it("llegeix la mida d'un JPEG, també si és progressiu", () => {
    expect(jpegSize(jpeg(2400, 1600))).toEqual({ width: 2400, height: 1600 });
    expect(jpegSize(jpeg(640, 480, 0xc2))).toEqual({ width: 640, height: 480 });
  });

  it("el que no és un JPEG no passa", () => {
    expect(jpegSize(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(jpegSize(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull();
    expect(jpegSize(new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull();
    expect(jpegSize(jpeg(0, 100))).toBeNull();
  });

  it("una taula de Huffman (DHT) no es confon amb la mida", () => {
    const withDht = new Uint8Array([0xff, 0xd8, 0xff, 0xc4, 0x00, 0x04, 0x01, 0x02, ...jpeg(300, 200).slice(8)]);
    expect(jpegSize(withDht)).toEqual({ width: 300, height: 200 });
  });
});
