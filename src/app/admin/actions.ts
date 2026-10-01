"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { displayName, ENTITIES, isEntity, parseBaseValue, parseContent, type EntityConfig, type EntityName } from "@/lib/admin/entities";
import { jpegSize, MAX_BYTES, MAX_SIDE } from "@/lib/admin/image";
import {
  addToGallery,
  createContent,
  deleteContent,
  getContent,
  logChange,
  moveContent,
  moveInGallery,
  removeFromGallery,
  replaceImage,
  saveContent,
  type ChangeAction,
  type UploadedImage,
} from "@/lib/supabase/admin-content";
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

async function contentName(entity: EntityName, id: string) {
  const content = await getContent(entity, id);
  return displayName(ENTITIES[entity], content?.translations ?? {}, id, content?.base);
}

/** Apunta el canvi al registre. Que el registre falli no ha de fer fallar un desat que ja s'ha fet. */
async function record(editor: Editor, entity: EntityName, id: string, action: ChangeAction, knownName?: string) {
  const rowName = knownName ?? (await contentName(entity, id));
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

/** La foto que arriba d'un formulari, comprovada: el navegador l'envia reduïda i en JPEG, però aquí no es dona per bo. */
async function readImage(form: FormData): Promise<UploadedImage | { errors: string[] }> {
  const file = form.get("image");
  if (!(file instanceof Blob) || file.size === 0) return { errors: ["No ha arribat cap foto."] };
  if (file.size > MAX_BYTES) return { errors: ["La foto pesa massa."] };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = jpegSize(bytes);
  if (!size || Math.max(size.width, size.height) > MAX_SIDE) return { errors: ["El fitxer no és una foto vàlida."] };
  return { bytes, ...size, name: crypto.randomUUID() };
}

export async function replaceImageAction(entity: string, id: string, _: FormState, form: FormData): Promise<FormState> {
  const editor = await currentEditor();
  if (!editor) return { errors: ["La sessió ha caducat. Torna a iniciar sessió."] };
  if (!isEntity(entity)) return { errors: ["Aquest contingut no existeix."] };

  const image = await readImage(form);
  if ("errors" in image) return image;

  const error = await replaceImage(entity, id, image);
  if (error) return { errors: [`No s'ha pogut desar la foto: ${error}`] };
  await record(editor, entity, id, "image");

  const config: EntityConfig = ENTITIES[entity];
  for (const tag of config.tags) revalidateTag(tag, { expire: 0 });
  return { savedAt: Date.now() };
}

/** Crea un contingut nou en esborrany i obre'l per omplir-lo. */
export async function createContentAction(entity: string) {
  const editor = await currentEditor();
  if (!editor) redirect("/admin/login");
  if (!isEntity(entity)) redirect("/admin");

  const created = await createContent(entity, `nou-${crypto.randomUUID().slice(0, 8)}`);
  if ("error" in created) throw new Error(`No s'ha pogut crear: ${created.error}`);
  await record(editor, entity, created.id, "create");
  // Neix en esborrany: la web pública no canvia fins que es publiqui, i llavors ja s'invalida la caché.
  redirect(`/admin/${entity}/${encodeURIComponent(created.id)}`);
}

export async function deleteContentAction(entity: string, id: string): Promise<FormState> {
  const editor = await currentEditor();
  if (!editor) return { errors: ["La sessió ha caducat. Torna a iniciar sessió."] };
  if (!isEntity(entity)) return { errors: ["Aquest contingut no existeix."] };

  // El nom s'ha de llegir abans: després ja no hi serà.
  const config: EntityConfig = ENTITIES[entity];
  const name = await contentName(entity, id);
  const error = await deleteContent(entity, id);
  if (error) return { errors: [`No s'ha pogut esborrar: ${error}`] };

  await record(editor, entity, id, "delete", name);
  for (const tag of config.tags) revalidateTag(tag, { expire: 0 });
  redirect(`/admin/${entity}`);
}

/** Feina comuna de les accions de la galeria: sessió, canvi, registre i refrescar el panell i la web. */
async function galleryChange(entity: string, id: string, change: (entity: EntityName) => Promise<string | null>): Promise<FormState> {
  const editor = await currentEditor();
  if (!editor) return { errors: ["La sessió ha caducat. Torna a iniciar sessió."] };
  if (!isEntity(entity)) return { errors: ["Aquest contingut no existeix."] };

  const error = await change(entity);
  if (error) return { errors: [`No s'ha pogut desar: ${error}`] };
  await record(editor, entity, id, "image");

  const config: EntityConfig = ENTITIES[entity];
  for (const tag of config.tags) revalidateTag(tag, { expire: 0 });
  // Refresca la pàgina del panell que estigui oberta (la fitxa o l'editor visual) amb la galeria nova.
  revalidatePath("/admin", "layout");
  return { savedAt: Date.now() };
}

export async function addGalleryImageAction(entity: string, id: string, form: FormData): Promise<FormState> {
  const image = await readImage(form);
  if ("errors" in image) return image;
  return galleryChange(entity, id, (name) => addToGallery(name, id, image));
}

export async function removeGalleryImageAction(entity: string, id: string, mediaId: string): Promise<FormState> {
  return galleryChange(entity, id, (name) => removeFromGallery(name, id, mediaId));
}

export async function moveGalleryImageAction(entity: string, id: string, mediaId: string, delta: 1 | -1): Promise<FormState> {
  if (delta !== 1 && delta !== -1) return { errors: ["Moviment desconegut."] };
  return galleryChange(entity, id, (name) => moveInGallery(name, id, mediaId, delta));
}

export async function moveContentAction(entity: string, id: string, delta: 1 | -1): Promise<FormState> {
  if (!(await currentEditor())) return { errors: ["La sessió ha caducat. Torna a iniciar sessió."] };
  if (!isEntity(entity)) return { errors: ["Aquest contingut no existeix."] };
  if (delta !== 1 && delta !== -1) return { errors: ["Moviment desconegut."] };

  const error = await moveContent(entity, id, delta);
  if (error) return { errors: [`No s'ha pogut reordenar: ${error}`] };

  const config: EntityConfig = ENTITIES[entity];
  for (const tag of config.tags) revalidateTag(tag, { expire: 0 });
  revalidatePath("/admin", "layout");
  return { savedAt: Date.now() };
}

/** Desa una sola cel·la de la taula (un camp que no depèn de l'idioma). */
export async function updateFieldAction(entity: string, id: string, name: string, value: string | boolean): Promise<FormState> {
  const editor = await currentEditor();
  if (!editor) return { errors: ["La sessió ha caducat. Torna a iniciar sessió."] };
  if (!isEntity(entity)) return { errors: ["Aquest contingut no existeix."] };
  if (typeof value !== "string" && typeof value !== "boolean") return { errors: ["Valor desconegut."] };

  const config: EntityConfig = ENTITIES[entity];
  const parsed = parseBaseValue(config, name, value);
  if (!parsed.ok) return { errors: parsed.errors };

  const error = await saveContent(entity, id, { base: parsed.value, translations: {} as never });
  if (error) return { errors: [`No s'ha pogut desar: ${error}`] };
  await record(editor, entity, id, "text");

  for (const tag of config.tags) revalidateTag(tag, { expire: 0 });
  revalidatePath("/admin", "layout");
  return { savedAt: Date.now() };
}
