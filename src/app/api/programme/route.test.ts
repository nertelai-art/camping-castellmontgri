import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getWeekProgramme = vi.hoisted(() => vi.fn(async () => [] as unknown[]));
vi.mock("@/lib/supabase/content", () => ({ getWeekProgramme }));

import { GET } from "./route";

const get = (query: string) => GET(new NextRequest(`https://x.test/api/programme${query}`));

describe("GET /api/programme", () => {
  beforeEach(() => getWeekProgramme.mockClear());

  it("torna la setmana sencera encara que li demanin un dia del mig", async () => {
    const response = await get("?locale=ca&week=2027-07-08");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ week: "2027-07-05", sessions: [] });
    expect(getWeekProgramme).toHaveBeenCalledWith("ca", "2027-07-05");
  });

  it("rebutja un idioma o un dia inventats", async () => {
    expect((await get("?locale=xx&week=2027-07-05")).status).toBe(400);
    expect((await get("?locale=ca&week=ahir")).status).toBe(400);
    expect(getWeekProgramme).not.toHaveBeenCalled();
  });
});
