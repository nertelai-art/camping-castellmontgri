import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag: (...args: unknown[]) => revalidateTag(...args) }));

const { POST } = await import("./route");

const call = (body: unknown, secret?: string) =>
  POST(
    new NextRequest("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "content-type": "application/json", ...(secret ? { "x-revalidate-secret": secret } : {}) },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    revalidateTag.mockReset();
    vi.stubEnv("REVALIDATE_SECRET", "s3cret");
  });

  it("rebutja peticions sense el secret", async () => {
    expect((await call({ tags: ["sections"] })).status).toBe(401);
    expect((await call({ tags: ["sections"] }, "dolent")).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rebutja etiquetes que no són noms de taula", async () => {
    expect((await call({ tags: ["../etc"] }, "s3cret")).status).toBe(400);
  });

  it("expira de seguida les etiquetes demanades", async () => {
    const res = await call({ tags: ["sections", "services"] }, "s3cret");
    expect(res.status).toBe(200);
    expect(revalidateTag.mock.calls).toEqual([
      ["sections", { expire: 0 }],
      ["services", { expire: 0 }],
    ]);
  });

  it("sense etiquetes, invalida tot el contingut", async () => {
    await call({}, "s3cret");
    expect(revalidateTag).toHaveBeenCalledWith("content", { expire: 0 });
  });

  it("no s'obre mai si el servidor no té secret configurat", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    expect((await call({}, "")).status).toBe(401);
  });
});
