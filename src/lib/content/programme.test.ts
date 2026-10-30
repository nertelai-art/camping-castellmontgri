import { describe, expect, it } from "vitest";
import { addDays, isDay, mondayOf, parseSession, shortTime, todayAtCamping, weekDays } from "./programme";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};
const VALID = { activity_id: "a1", day: "2027-07-05", starts_at: "10:00", ends_at: "11:30", place: " Piscina Ombra " };

describe("dies del programa", () => {
  it("només accepta dies que existeixen", () => {
    expect(isDay("2027-07-05")).toBe(true);
    expect(isDay("2027-02-31")).toBe(false);
    expect(isDay("5/7/2027")).toBe(false);
    expect(isDay(null)).toBe(false);
  });

  it("troba el dilluns de la setmana, també si és diumenge o canvia de mes", () => {
    expect(mondayOf("2027-07-05")).toBe("2027-07-05");
    expect(mondayOf("2027-07-11")).toBe("2027-07-05");
    expect(mondayOf("2027-08-01")).toBe("2027-07-26");
  });

  it("dona els set dies de dilluns a diumenge", () => {
    const days = weekDays("2027-06-28");
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2027-06-28");
    expect(days[6]).toBe("2027-07-04");
  });

  it("travessa el canvi d'hora sense perdre cap dia", () => {
    expect(addDays("2027-03-27", 1)).toBe("2027-03-28");
    expect(addDays("2027-03-28", 1)).toBe("2027-03-29");
  });

  it("el dia és el del càmping, no el de l'UTC", () => {
    expect(todayAtCamping(new Date("2027-07-05T22:30:00Z"))).toBe("2027-07-06");
    expect(todayAtCamping(new Date("2027-01-05T22:30:00Z"))).toBe("2027-01-05");
  });

  it("escurça l'hora de la base de dades", () => {
    expect(shortTime("10:00:00")).toBe("10:00");
  });
});

describe("formulari d'una sessió", () => {
  it("llegeix una sessió completa", () => {
    expect(parseSession(form(VALID))).toEqual({ ok: true, value: { activityId: "a1", day: "2027-07-05", startsAt: "10:00", endsAt: "11:30", place: "Piscina Ombra" } });
  });

  it("l'hora de final i el lloc són opcionals", () => {
    expect(parseSession(form({ ...VALID, ends_at: "", place: "" }))).toMatchObject({ ok: true, value: { endsAt: null, place: null } });
  });

  it("explica tot el que falta", () => {
    expect(parseSession(form({ activity_id: "", day: "x", starts_at: "" }))).toEqual({ ok: false, errors: ["Tria una activitat.", "El dia no és vàlid.", "Escriu l'hora d'inici."] });
  });

  it("no deixa acabar abans de començar", () => {
    expect(parseSession(form({ ...VALID, ends_at: "09:00" }))).toEqual({ ok: false, errors: ["L'hora de final ha de ser després de la d'inici."] });
  });
});
