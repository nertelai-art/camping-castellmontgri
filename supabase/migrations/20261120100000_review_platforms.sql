-- Les notes del càmping a les plataformes de ressenyes (Booking.com, Google, Tripadvisor…). Surten a la portada, amb les opinions, a sobre
-- dels allotjaments. Les escriu el client al panell: cap número al codi. Una plataforma en esborrany no surt.
create table public.review_platforms (
  id uuid primary key default gen_random_uuid(),
  -- El nom com es veu: «Booking.com», «Google». És una marca: no es tradueix.
  platform text not null check (length(trim(platform)) > 0),
  rating numeric(3, 1) not null check (rating > 0),
  scale smallint not null default 10 check (scale in (5, 10)),
  review_count integer check (review_count >= 0),
  -- La pàgina de les ressenyes, perquè qui ho vulgui les pugui llegir allà.
  url text check (url is null or url ~ '^https://'),
  sort_order integer not null default 0,
  status public.publish_status not null default 'draft',
  updated_at timestamptz not null default now(),
  check (rating <= scale)
);

create trigger set_updated_at before update on public.review_platforms
  for each row execute function public.set_updated_at();

alter table public.review_platforms enable row level security;
create policy "lectura publicats" on public.review_platforms for select to anon, authenticated
  using (status = 'published' or (select private.is_editor()));
create policy "editors: afegir" on public.review_platforms for insert to authenticated
  with check ((select private.is_editor()));
create policy "editors: modificar" on public.review_platforms for update to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));
create policy "editors: esborrar" on public.review_platforms for delete to authenticated
  using ((select private.is_editor()));

-- Les opinions passen a anar just abans dels allotjaments (entre la benvinguda, 10, i els allotjaments, 20). Només si el client
-- no les ha mogudes des del panell: si ja no són a la seva posició original (70), es respecta el que hagi triat.
update public.sections set sort_order = 15 where key = 'testimonials' and sort_order = 70;

-- Les notes de partida, comprovades a les pàgines de cada plataforma el 20/11/2026. Canvien amb el temps: es posen al dia al panell.
insert into public.review_platforms (platform, rating, scale, review_count, url, sort_order, status) values
  ('Booking.com', 7.9, 10, 1583, 'https://www.booking.com/hotel/es/camping-castell-montgri.html', 10, 'published'),
  ('Campings.com', 8.6, 10, null, 'https://www.campings.com/en-gb/campsite/camping-castell-montgri-77385', 20, 'published');
