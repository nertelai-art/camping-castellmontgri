"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { displayName, ENTITIES, isEntity, parseContent, type EntityConfig, type EntityName } from "@/lib/admin/entities";
import { jpegSize, MAX_BYTES, MAX_SIDE } from "@/lib/admin/image";
import { getContent, logChange, replaceImage, saveContent, type ChangeAction } from "@/lib/supabase/admin-content";
import { currentEditor, sessionClient, type Editor } from "@/lib/supabase/session";

export type FormState = { errors?: string[]; savedAt?: number };

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { errors: ["Escriu el correu i la contrasenya."] };

  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // El mateix missatge tant si el correu no existeix com si la contrasenya és incorrecta.
  if (error) return { errors: ["El correu o la contrasenya no són correctes."] };

  // Tenir compte no vol dir poder editar: cal un perfil d'editor.
  if (!(await currentEditor())) {
    await supabase.auth.signOut();
    return { errors: ["Aquest compte no té accés al panell. Demana-ho a qui l'administra."] };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** Apunta el canvi al registre. Que el registre falli no ha de fer fallar un desat que ja s'ha fet. */
async function record(editor: Editor, entity: EntityName, id: string, action: ChangeAction) {
  const content = await getContent(entity, id);
  const rowName = displayName(ENTITIES[entity], content?.translations ?? {}, id);
  const error = await logChange({ editor: editor.name ?? editor.email, entity, rowId: id, rowName, action });
  if (error) console.error(`[admin] no s'ha pogut apuntar el canvi al registre: ${error}`);
}

export async function saveContentAction(entity: string, id: string, _: FormState, form: FormData): Promise<FormState> {
  // Una acció de servidor és un endpoint públic: es torna a comprovar qui la crida, no n'hi ha prou amb el layout.
  const editor = await currentEditor();
  if (!editor) return { errors: ["La sessió ha caducat. Torna a iniciar sessió."] };
  if (!isEntity(entity)) return { errors: ["Aquest contingut no existeix."] };

  const config: EntityConfig = ENTITIES[entity];
  const parsed = parseContent(config, form);
  if (!parsed.ok) return { errors: parsed.errors };

  const error = await saveContent(entity, id, parsed.value);
  if (error) return { errors: [`No s'ha pogut desar: ${error}`] };

  await record(editor, entity, id, "text");
  // La web pública llegeix de la caché: s'invalida la taula tocada i la petició següent ja veu el canvi.
  for (const tag of config.tags) revalidateTag(tag, { expire: 0 });
  return { savedAt: Date.now() };
}

export async function replaceImageAction(entity: string, id: string, _: FormState, form: FormData): Promise<FormState> {
  const editor = await currentEditor();
  if (!editor) return { errors: ["La sessió ha caducat. Torna a iniciar sessió."] };
  if (!isEntity(entity)) return { errors: ["Aquest contingut no existeix."] };

  const file = form.get("image");
  if (!(file instanceof Blob) || file.size === 0) return { errors: ["No ha arribat cap foto."] };
  if (file.size > MAX_BYTES) return { errors: ["La foto pesa massa."] };
  // El navegador ja l'envia reduïda i en JPEG; aquí es comprova que ho sigui de debò i se'n llegeix la mida.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = jpegSize(bytes);
  if (!size || Math.max(size.width, size.height) > MAX_SIDE) return { errors: ["El fitxer no és una foto vàlida."] };

  const error = await replaceImage(entity, id, { bytes, ...size, name: crypto.randomUUID() });
  if (error) return { errors: [`No s'ha pogut desar la foto: ${error}`] };
  await record(editor, entity, id, "image");

  const config: EntityConfig = ENTITIES[entity];
  for (const tag of config.tags) revalidateTag(tag, { expire: 0 });
  return { savedAt: Date.now() };
}
