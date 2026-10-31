import { describe, expect, it } from "vitest";
import { collapseShift, countAt, stageProgress } from "./stage";

describe("escena guiada pel scroll", () => {
  it("el progrés va de 0 a 1 mentre el bloc està fixat, i no en surt", () => {
    expect(stageProgress(100, 2000, 800)).toBe(0);
    expect(stageProgress(0, 2000, 800)).toBe(0);
    expect(stageProgress(-600, 2000, 800)).toBe(0.5);
    expect(stageProgress(-1200, 2000, 800)).toBe(1);
    expect(stageProgress(-5000, 2000, 800)).toBe(1);
  });

  it("un bloc que no és més alt que la pantalla no té recorregut", () => {
    expect(stageProgress(-50, 800, 800)).toBe(0);
  });

  it("en acabar, la pàgina puja just el que s'ha passat, perquè la vista no salti", () => {
    expect(collapseShift(-1700, 1700)).toBe(1700);
    expect(collapseShift(-5000, 1700)).toBe(1700);
    expect(collapseShift(-300, 1700)).toBe(300);
    expect(collapseShift(200, 1700)).toBe(0);
  });

  it("les xifres compten només dins del seu tram i acaben al valor exacte", () => {
    expect(countAt(26, 0.1, 0.6, 0.8)).toBe(0);
    expect(countAt(26, 0.7, 0.6, 0.8)).toBe(13);
    expect(countAt(26, 0.8, 0.6, 0.8)).toBe(26);
    expect(countAt(26, 1, 0.6, 0.8)).toBe(26);
  });
});
