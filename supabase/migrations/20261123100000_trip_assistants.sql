-- Els assistents d'IA de «El teu viatge, amb la IA» (ChatGPT, Claude, Gemini): el text de cada finestra s'edita al panell, en 5 idiomes.
-- Quins assistents hi ha i com s'hi obre el text és codi (src/lib/trip/assistants.ts): aquí no se n'afegeixen, només s'editen o s'amaguen.
create table public.trip_assistants (
  key text primary key check (key in ('chatgpt', 'claude', 'gemini')),
  -- Com es veu al botó i a la finestra. És una marca: no es tradueix.
  name text not null check (length(trim(name)) > 0),
  sort_order integer not null default 0,
  status public.publish_status not null default 'published',
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.trip_assistants
  for each row execute function public.set_updated_at();

create table public.trip_assistant_translations (
  assistant_key text not null references public.trip_assistants (key) on delete cascade,
  locale public.locale not null,
  -- La salutació gran de la finestra («Què planifiquem?»).
  greeting text not null check (length(trim(greeting)) > 0),
  -- El text que s'envia a l'assistent, amb {nits}, {camping}, {lloc}, {web} i {tipus}. Buit: el de la web per defecte.
  prompt text,
  primary key (assistant_key, locale)
);

alter table public.trip_assistants enable row level security;
create policy "lectura publicats" on public.trip_assistants for select to anon, authenticated
  using (status = 'published' or (select private.is_editor()));
create policy "editors: afegir" on public.trip_assistants for insert to authenticated
  with check ((select private.is_editor()));
create policy "editors: modificar" on public.trip_assistants for update to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));
create policy "editors: esborrar" on public.trip_assistants for delete to authenticated
  using ((select private.is_editor()));

alter table public.trip_assistant_translations enable row level security;
create policy "lectura si el pare és visible" on public.trip_assistant_translations for select to anon, authenticated
  using (exists (select 1 from public.trip_assistants p where p.key = assistant_key));
create policy "editors: afegir" on public.trip_assistant_translations for insert to authenticated
  with check ((select private.is_editor()));
create policy "editors: modificar" on public.trip_assistant_translations for update to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));
create policy "editors: esborrar" on public.trip_assistant_translations for delete to authenticated
  using ((select private.is_editor()));

-- Els textos de partida són els que la web tenia fins ara a messages/ (els mateixos per als tres).
insert into public.trip_assistants (key, name, sort_order) values
  ('chatgpt', 'ChatGPT', 10),
  ('claude', 'Claude', 20),
  ('gemini', 'Gemini', 30);

insert into public.trip_assistant_translations (assistant_key, locale, greeting, prompt) values
  ('chatgpt', 'es', '¿Qué planificamos?', 'Voy a pasar {nits} en {camping} ({lloc}) y quiero un viaje de tipo «{tipus}». Mira su web, {web}, y prepárame un plan día a día (mañana, tarde y noche) con qué disfrutar en el camping, lugares con encanto y dónde comer cerca, y un consejo de los que no salen en las guías. Ve al grano, con listas cortas.'),
  ('chatgpt', 'ca', 'Què planifiquem?', 'Passaré {nits} a {camping} ({lloc}) i vull un viatge de tipus «{tipus}». Mira la seva web, {web}, i prepara''m un pla dia a dia (matí, tarda i nit) amb què gaudir al càmping, llocs amb encant i on menjar a prop, i un consell dels que no surten a les guies. Ves al gra, amb llistes curtes.'),
  ('chatgpt', 'fr', 'Que prévoit-on ?', 'Je vais passer {nits} à {camping} ({lloc}) et je veux un voyage de type « {tipus} ». Consulte leur site, {web}, et prépare-moi un programme jour par jour (matin, après-midi et soir) : quoi faire au camping, les endroits qui ont du charme et où manger à proximité, et un conseil qu’on ne trouve pas dans les guides. Va droit au but, avec des listes courtes.'),
  ('chatgpt', 'en', 'What shall we plan?', 'I’m spending {nits} at {camping} ({lloc}) and I want a “{tipus}” trip. Check their website, {web}, and make me a day-by-day plan (morning, afternoon and evening) with what to enjoy at the campsite, charming places and where to eat nearby, and one tip you won’t find in the guidebooks. Get to the point, with short lists.'),
  ('chatgpt', 'nl', 'Wat gaan we plannen?', 'Ik verblijf {nits} op {camping} ({lloc}) en wil een reis van het type “{tipus}”. Bekijk hun website, {web}, en maak een plan per dag (ochtend, middag en avond) met wat er op de camping te beleven is, leuke plekken en waar je in de buurt kunt eten, en een tip die niet in de reisgidsen staat. Kom meteen ter zake, met korte lijstjes.'),
  ('claude', 'es', '¿Qué planificamos?', 'Voy a pasar {nits} en {camping} ({lloc}) y quiero un viaje de tipo «{tipus}». Mira su web, {web}, y prepárame un plan día a día (mañana, tarde y noche) con qué disfrutar en el camping, lugares con encanto y dónde comer cerca, y un consejo de los que no salen en las guías. Ve al grano, con listas cortas.'),
  ('claude', 'ca', 'Què planifiquem?', 'Passaré {nits} a {camping} ({lloc}) i vull un viatge de tipus «{tipus}». Mira la seva web, {web}, i prepara''m un pla dia a dia (matí, tarda i nit) amb què gaudir al càmping, llocs amb encant i on menjar a prop, i un consell dels que no surten a les guies. Ves al gra, amb llistes curtes.'),
  ('claude', 'fr', 'Que prévoit-on ?', 'Je vais passer {nits} à {camping} ({lloc}) et je veux un voyage de type « {tipus} ». Consulte leur site, {web}, et prépare-moi un programme jour par jour (matin, après-midi et soir) : quoi faire au camping, les endroits qui ont du charme et où manger à proximité, et un conseil qu’on ne trouve pas dans les guides. Va droit au but, avec des listes courtes.'),
  ('claude', 'en', 'What shall we plan?', 'I’m spending {nits} at {camping} ({lloc}) and I want a “{tipus}” trip. Check their website, {web}, and make me a day-by-day plan (morning, afternoon and evening) with what to enjoy at the campsite, charming places and where to eat nearby, and one tip you won’t find in the guidebooks. Get to the point, with short lists.'),
  ('claude', 'nl', 'Wat gaan we plannen?', 'Ik verblijf {nits} op {camping} ({lloc}) en wil een reis van het type “{tipus}”. Bekijk hun website, {web}, en maak een plan per dag (ochtend, middag en avond) met wat er op de camping te beleven is, leuke plekken en waar je in de buurt kunt eten, en een tip die niet in de reisgidsen staat. Kom meteen ter zake, met korte lijstjes.'),
  ('gemini', 'es', '¿Qué planificamos?', 'Voy a pasar {nits} en {camping} ({lloc}) y quiero un viaje de tipo «{tipus}». Mira su web, {web}, y prepárame un plan día a día (mañana, tarde y noche) con qué disfrutar en el camping, lugares con encanto y dónde comer cerca, y un consejo de los que no salen en las guías. Ve al grano, con listas cortas.'),
  ('gemini', 'ca', 'Què planifiquem?', 'Passaré {nits} a {camping} ({lloc}) i vull un viatge de tipus «{tipus}». Mira la seva web, {web}, i prepara''m un pla dia a dia (matí, tarda i nit) amb què gaudir al càmping, llocs amb encant i on menjar a prop, i un consell dels que no surten a les guies. Ves al gra, amb llistes curtes.'),
  ('gemini', 'fr', 'Que prévoit-on ?', 'Je vais passer {nits} à {camping} ({lloc}) et je veux un voyage de type « {tipus} ». Consulte leur site, {web}, et prépare-moi un programme jour par jour (matin, après-midi et soir) : quoi faire au camping, les endroits qui ont du charme et où manger à proximité, et un conseil qu’on ne trouve pas dans les guides. Va droit au but, avec des listes courtes.'),
  ('gemini', 'en', 'What shall we plan?', 'I’m spending {nits} at {camping} ({lloc}) and I want a “{tipus}” trip. Check their website, {web}, and make me a day-by-day plan (morning, afternoon and evening) with what to enjoy at the campsite, charming places and where to eat nearby, and one tip you won’t find in the guidebooks. Get to the point, with short lists.'),
  ('gemini', 'nl', 'Wat gaan we plannen?', 'Ik verblijf {nits} op {camping} ({lloc}) en wil een reis van het type “{tipus}”. Bekijk hun website, {web}, en maak een plan per dag (ochtend, middag en avond) met wat er op de camping te beleven is, leuke plekken en waar je in de buurt kunt eten, en een tip die niet in de reisgidsen staat. Kom meteen ter zake, met korte lijstjes.');
