import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { CONTENT_TAG } from "@/lib/content/tags";

// Invalida la caché del contingut. La crida l'admin (o un webhook de Supabase) després de desar.
// POST /api/revalidate  { "tags": ["accommodations"] }  amb capçalera `x-revalidate-secret`.

const body = z.object({ tags: z.array(z.string().regex(/^[a-z_]+$/)).min(1).default([CONTENT_TAG]) });

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  // expire: 0 → la petició següent ja llegeix el contingut nou (res de servir la còpia vella un cop més).
  for (const tag of parsed.data.tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: parsed.data.tags });
}
