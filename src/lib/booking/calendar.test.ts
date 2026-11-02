import { describe, expect, it } from "vitest";
import { addDays, addMonths, formatDay, localDay, monthCells, monthOf, nightsBetween, pickDay, weekdayNames } from "./calendar";

describe("calendari de la cerca", () => {
  it("el primer clic és l'entrada, el segon la sortida i el tercer torna a començar", () => {
    const first = pickDay({ checkIn: "", checkOut: "" }, "2027-05-10");
    expect(first).toEqual({ checkIn: "2027-05-10", checkOut: "" });
    const second = pickDay(first, "2027-05-14");
    expect(second).toEqual({ checkIn: "2027-05-10", checkOut: "2027-05-14" });
    expect(pickDay(second, "2027-06-01")).toEqual({ checkIn: "2027-06-01", checkOut: "" });
  });

  it("una sortida que no va després de l'entrada passa a ser l'entrada", () => {
    expect(pickDay({ checkIn: "2027-05-10", checkOut: "" }, "2027-05-08")).toEqual({ checkIn: "2027-05-08", checkOut: "" });
    expect(pickDay({ checkIn: "2027-05-10", checkOut: "" }, "2027-05-10")).toEqual({ checkIn: "2027-05-10", checkOut: "" });
  });

  it("el mes comença pel dilluns, amb caselles buides abans del dia 1", () => {
    // L'1 de maig de 2027 és dissabte: cinc caselles buides.
    const cells = monthCells({ year: 2027, month: 4 });
    expect(cells.slice(0, 6)).toEqual([null, null, null, null, null, "2027-05-01"]);
    expect(cells.at(-1)).toBe("2027-05-31");
    // L'1 de febrer de 2027 és dilluns: cap, i és un mes de 28 dies.
    const february = monthCells({ year: 2027, month: 1 });
    expect(february[0]).toBe("2027-02-01");
    expect(february).toHaveLength(28);
  });

  it("els càlculs de dies i mesos travessen el canvi d'any i d'hora", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
    expect(nightsBetween("2027-03-27", "2027-03-29")).toBe(2);
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(addMonths({ year: 2027, month: 0 }, -1)).toEqual({ year: 2026, month: 11 });
    expect(monthOf("2027-05-10")).toEqual({ year: 2027, month: 4 });
  });

  it("avui és el dia local de qui mira", () => {
    expect(localDay(new Date(2027, 0, 5, 0, 30))).toBe("2027-01-05");
  });

  it("els noms surten en l'idioma de la pàgina", () => {
    expect(weekdayNames("en")[0]).toBe("Mon");
    expect(formatDay("2027-05-10", "en")).toBe("May 10");
  });
});
