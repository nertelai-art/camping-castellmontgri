import { describe, expect, it } from "vitest";
import { CONTENT_TAG, tagsForRequest } from "./tags";

describe("etiquetes de caché", () => {
  it("afegeix la taula consultada", () => {
    expect(tagsForRequest("https://x.supabase.co/rest/v1/accommodations?select=*&status=eq.published")).toEqual([
      CONTENT_TAG,
      "accommodations",
    ]);
  });

  it("deixa només la comuna per a altres rutes", () => {
    expect(tagsForRequest("https://x.supabase.co/storage/v1/object/public/media/a.jpg")).toEqual([CONTENT_TAG]);
  });
});
