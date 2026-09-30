-- Esquema de contingut editable de la web.
-- Patró: taula base (el que no depèn de l'idioma) + *_translations (locale, …).
-- Lectura pública només del que està publicat; escriptura només per a editors (RLS).

-- ─── Tipus ────────────────────────────────────────────────────────────────────
create type public.locale as enum ('es', 'ca', 'fr', 'en', 'nl');
create type public.publish_status as enum ('draft', 'published');
create type public.app_role as enum ('admin', 'editor');

-- ─── Utilitats ────────────────────────────────────────────────────────────────
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── Usuaris del panell ───────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'editor',
  display_name text,
  created_at timestamptz not null default now()
);

create function public.is_editor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()));
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

alter table public.profiles enable row level security;
create policy "profiles: cadascú es veu a si mateix, l'admin els veu tots" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: només l'admin els gestiona" on public.profiles
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ─── Imatges i fitxers ────────────────────────────────────────────────────────
create table public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,              -- camí dins el bucket «media»
  mime_type text not null,
  width integer,
  height integer,
  source_url text unique,                 -- d'on ve (web antic), per fer el seed idempotent
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_translations (
  media_id uuid not null references public.media (id) on delete cascade,
  locale public.locale not null,
  alt text not null default '',
  primary key (media_id, locale)
);

-- ─── Configuració global (una sola fila) ──────────────────────────────────────
create table public.site_settings (
  id boolean primary key default true check (id),
  brand_name text not null,
  legal_name text not null,
  logo_media_id uuid references public.media (id) on delete set null,
  phone_display text,
  phone_e164 text,
  email_info text,
  email_reservations text,
  email_events text,
  email_jobs text,
  email_whistleblowing text,
  street text,
  locality text,
  postal_code text,
  region text,
  country text,
  lat double precision,
  lng double precision,
  season_open date,
  season_close date,
  license_code text,
  booking_url text,
  client_portal_url text,
  updated_at timestamptz not null default now()
);

create table public.site_settings_translations (
  locale public.locale primary key,
  season_notice text,
  seo_title text,
  seo_description text
);

-- ─── Seccions de la landing ───────────────────────────────────────────────────
create table public.sections (
  key text primary key,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  media_id uuid references public.media (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.section_translations (
  section_key text not null references public.sections (key) on delete cascade on update cascade,
  locale public.locale not null,
  title text not null,
  body text,
  highlight text,
  cta_label text,
  primary key (section_key, locale)
);

-- ─── Allotjaments ─────────────────────────────────────────────────────────────
create table public.accommodation_categories (
  key text primary key,
  sort_order integer not null default 0,
  media_id uuid references public.media (id) on delete set null
);

create table public.accommodation_category_translations (
  category_key text not null references public.accommodation_categories (key) on delete cascade on update cascade,
  locale public.locale not null,
  name text not null,
  description text,
  primary key (category_key, locale)
);

create table public.accommodations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_key text not null references public.accommodation_categories (key) on update cascade,
  capacity_max integer check (capacity_max > 0),
  size_m2 numeric(6, 1) check (size_m2 > 0),
  bedrooms integer check (bedrooms >= 0),
  bathrooms integer check (bathrooms >= 0),
  air_conditioning boolean not null default false,
  is_accessible boolean not null default false,
  booking_category_id integer,            -- categoria al motor de reserves
  cover_media_id uuid references public.media (id) on delete set null,
  sort_order integer not null default 0,
  status public.publish_status not null default 'draft',
  updated_at timestamptz not null default now()
);
create index on public.accommodations (category_key, sort_order);

create table public.accommodation_translations (
  accommodation_id uuid not null references public.accommodations (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  description text,
  features text[] not null default '{}',
  primary key (accommodation_id, locale)
);

create table public.accommodation_media (
  accommodation_id uuid not null references public.accommodations (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (accommodation_id, media_id)
);
create index on public.accommodation_media (media_id);

-- ─── Serveis ──────────────────────────────────────────────────────────────────
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  legacy_anchor text,                     -- #s14 del web antic, per a redireccions
  icon_media_id uuid references public.media (id) on delete set null,
  media_id uuid references public.media (id) on delete set null,
  sort_order integer not null default 0,
  status public.publish_status not null default 'draft',
  updated_at timestamptz not null default now()
);

create table public.service_translations (
  service_id uuid not null references public.services (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  description text,
  primary key (service_id, locale)
);

-- ─── Restauració ──────────────────────────────────────────────────────────────
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  zone text check (zone in ('ombra', 'panorama')),
  hours text,
  cover_media_id uuid references public.media (id) on delete set null,
  sort_order integer not null default 0,
  status public.publish_status not null default 'draft',
  updated_at timestamptz not null default now()
);

create table public.restaurant_translations (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  description text,
  menu_url text,
  primary key (restaurant_id, locale)
);

-- ─── Animació ─────────────────────────────────────────────────────────────────
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  audience text check (audience in ('children', 'family', 'adult')),
  zone text check (zone in ('ombra', 'panorama')),
  hours text,
  cover_media_id uuid references public.media (id) on delete set null,
  sort_order integer not null default 0,
  status public.publish_status not null default 'draft',
  updated_at timestamptz not null default now()
);

create table public.activity_translations (
  activity_id uuid not null references public.activities (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  description text,
  primary key (activity_id, locale)
);

-- ─── Opinions (en l'idioma original) ─────────────────────────────────────────
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  source text,
  locale public.locale not null,
  title text,
  quote text not null,
  rating smallint check (rating between 1 and 5),
  sort_order integer not null default 0,
  status public.publish_status not null default 'draft',
  updated_at timestamptz not null default now()
);

-- ─── Plànol interactiu (coordenades en % sobre la il·lustració) ─────────────
create table public.map_points (
  id uuid primary key default gen_random_uuid(),
  x numeric(5, 2) not null check (x between 0 and 100),
  y numeric(5, 2) not null check (y between 0 and 100),
  kind text not null,
  service_id uuid references public.services (id) on delete cascade,
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  activity_id uuid references public.activities (id) on delete cascade,
  accommodation_category_key text references public.accommodation_categories (key) on delete cascade on update cascade,
  sort_order integer not null default 0,
  status public.publish_status not null default 'draft',
  updated_at timestamptz not null default now()
);

create table public.map_point_translations (
  map_point_id uuid not null references public.map_points (id) on delete cascade,
  locale public.locale not null,
  label text not null,
  primary key (map_point_id, locale)
);

-- ─── updated_at automàtic ────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['media', 'site_settings', 'sections', 'accommodations', 'services',
                           'restaurants', 'activities', 'testimonials', 'map_points']
  loop
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- 1) Taules sense estat de publicació: lectura pública.
-- 2) Taules amb `status`: lectura pública només si està publicat.
-- 3) Traduccions i galeries: lectura pública si el pare és visible.
-- En tots els casos, els editors ho veuen i ho escriuen tot.
do $$
declare t text;
begin
  foreach t in array array['media', 'media_translations', 'site_settings', 'site_settings_translations',
                           'sections', 'section_translations', 'accommodation_categories',
                           'accommodation_category_translations']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "lectura pública" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "escriptura editors" on public.%I for all to authenticated
                    using ((select public.is_editor())) with check ((select public.is_editor()))', t);
  end loop;

  foreach t in array array['accommodations', 'services', 'restaurants', 'activities', 'testimonials', 'map_points']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "lectura publicats" on public.%I for select to anon, authenticated
                    using (status = ''published'' or (select public.is_editor()))', t);
    execute format('create policy "escriptura editors" on public.%I for all to authenticated
                    using ((select public.is_editor())) with check ((select public.is_editor()))', t);
  end loop;
end;
$$;

-- Fills: [taula, columna FK, taula pare]
do $$
declare r text[];
begin
  foreach r slice 1 in array array[
    ['accommodation_translations', 'accommodation_id', 'accommodations'],
    ['accommodation_media', 'accommodation_id', 'accommodations'],
    ['service_translations', 'service_id', 'services'],
    ['restaurant_translations', 'restaurant_id', 'restaurants'],
    ['activity_translations', 'activity_id', 'activities'],
    ['map_point_translations', 'map_point_id', 'map_points']
  ]
  loop
    execute format('alter table public.%I enable row level security', r[1]);
    execute format('create policy "lectura si el pare és visible" on public.%I for select to anon, authenticated
                    using (exists (select 1 from public.%I p where p.id = %I))', r[1], r[3], r[2]);
    execute format('create policy "escriptura editors" on public.%I for all to authenticated
                    using ((select public.is_editor())) with check ((select public.is_editor()))', r[1]);
  end loop;
end;
$$;

-- ─── Storage ──────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 20 * 1024 * 1024,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/gif',
              'application/pdf', 'video/mp4', 'model/gltf-binary']);

create policy "media: els editors pugen fitxers" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select public.is_editor()));
create policy "media: els editors els modifiquen" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select public.is_editor()));
create policy "media: els editors els esborren" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select public.is_editor()));
