-- La galeria d'imatges de la portada: fotos lligades a una secció, que es gestionen des del panell com les d'un allotjament.
create table public.section_media (
  section_key text not null references public.sections (key) on delete cascade on update cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (section_key, media_id)
);
create index on public.section_media (media_id);

alter table public.section_media enable row level security;
create policy "lectura pública" on public.section_media for select to anon, authenticated using (true);
create policy "editors: afegir" on public.section_media for insert to authenticated with check ((select private.is_editor()));
create policy "editors: modificar" on public.section_media for update to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));
create policy "editors: esborrar" on public.section_media for delete to authenticated using ((select private.is_editor()));

insert into public.sections (key, sort_order) values ('gallery', 15) on conflict (key) do nothing;
insert into public.section_translations (section_key, locale, title) values
  ('gallery', 'es', 'Galería de imágenes'),
  ('gallery', 'ca', 'Galeria d''imatges'),
  ('gallery', 'fr', 'Galerie d''images'),
  ('gallery', 'en', 'Photo gallery'),
  ('gallery', 'nl', 'Fotogalerij')
on conflict (section_key, locale) do nothing;

-- Punt de partida: les fotos que ja ensenyen les seccions, els serveis i els restaurants. El client les canvia des del panell.
-- En una base nova encara no hi ha fotos: la galeria queda buida i no surt a la web fins que se n'hi posin.
insert into public.section_media (section_key, media_id, sort_order)
select 'gallery', picked.media_id, row_number() over (order by picked.rank, picked.sort_order)
from (
  select distinct on (candidate.media_id) candidate.media_id, candidate.rank, candidate.sort_order
  from (
    select media_id, 0 as rank, sort_order from public.sections where key in ('hero', 'welcome', 'entertainment', 'surroundings')
    union all
    select media_id, 1, sort_order from public.services where slug in ('swimming-pools', 'slides')
    union all
    select cover_media_id, 2, sort_order from public.restaurants
    union all
    select cover_media_id, 3, sort_order from public.activities
  ) candidate
  join public.media m on m.id = candidate.media_id and m.mime_type <> 'image/svg+xml'
  order by candidate.media_id, candidate.rank, candidate.sort_order
) picked
order by picked.rank, picked.sort_order
limit 13;

-- El preu «des de» que surt a les targetes. Sense preu, la targeta no n'ensenya cap.
alter table public.accommodations add column price_from numeric(8, 2) check (price_from >= 0);

-- El motor de reserves actual és WitBooking. Només es toca l'enllaç antic: si algú n'ha posat un altre des del panell, es respecta.
update public.site_settings
set booking_url = 'https://engine.witbooking.com/es/property/castellmontgri'
where booking_url like '%thelisresa%';
