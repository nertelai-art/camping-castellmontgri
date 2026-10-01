import { describe, expect, it } from "vitest";
import { mergeReadings, placeHouses, type Plot, type Roof } from "./map-plots";

const plot = (n: string, x: number, y: number, k: Plot["k"] = "cream"): Plot => ({ n, x, y, k });
const roof = (x: number, y: number, tent = false): Roof => ({ x, y, size: 25, tent });

describe("placeHouses", () => {
  it("dona a cada rètol el teulat més proper, sense repetir-ne cap", () => {
    const a = plot("101", 100, 100);
    const b = plot("102", 130, 100);
    const houses = placeHouses([a, b], [roof(95, 110), roof(122, 111)]);
    expect(houses).toHaveLength(2);
    expect(houses.find((h) => h.plot === a)).toMatchObject({ x: 95, y: 110 });
    expect(houses.find((h) => h.plot === b)).toMatchObject({ x: 122, y: 111 });
  });

  it("si no hi ha cap teulat a prop, posa la casa al costat del rètol", () => {
    const a = plot("813", 500, 500, "red");
    const [house] = placeHouses([a], [roof(900, 900)]);
    expect(house).toMatchObject({ x: 492, y: 510, plot: a });
  });

  it("les parcel·les (text) no tenen casa", () => {
    expect(placeHouses([plot("54", 100, 100, "text")], [])).toEqual([]);
  });

  it("conserva els teulats sense rètol, tret dels que trepitgen una casa", () => {
    const a = plot("7", 100, 100);
    const houses = placeHouses([a], [roof(92, 110), roof(98, 114), roof(300, 300, true)]);
    expect(houses).toHaveLength(2);
    expect(houses.filter((h) => !h.plot)).toEqual([{ x: 300, y: 300, size: 25, tent: true }]);
  });
});

describe("mergeReadings", () => {
  it("fusiona dues lectures del mateix rètol i en fa la mitjana", () => {
    const { plots, samePlace, sameNumber } = mergeReadings([plot("813", 1330, 696), plot("813", 1332, 698), plot("814", 1262, 705, "red")]);
    expect(plots.map((p) => [p.n, p.x, p.y, p.count])).toEqual([
      ["813", 1331, 697, 2],
      ["814", 1262, 705, 1],
    ]);
    expect(samePlace).toEqual([]);
    expect(sameNumber).toEqual([]);
  });

  it("avisa de dos números diferents al mateix lloc i d'un número repetit en dos llocs", () => {
    const { samePlace, sameNumber } = mergeReadings([plot("863", 100, 100), plot("868", 103, 101), plot("12", 500, 500), plot("12", 900, 900)]);
    expect(samePlace.map(([a, b]) => [a.n, b.n])).toEqual([["863", "868"]]);
    expect(sameNumber.map(([a, b]) => [a.n, b.n])).toEqual([["12", "12"]]);
  });
});
