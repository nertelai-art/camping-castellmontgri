-- Correccions dels advisors de Supabase sobre l'esquema inicial.

-- 1) Les funcions de rol no han de ser cridables per l'API (/rest/v1/rpc/is_editor).
--    Es mouen a un esquema no exposat; les polítiques les referencien per OID i continuen funcionant.
create schema if not exists private;
grant usage on schema private to anon, authenticated;
alter function public.is_editor() set schema private;
alter function public.is_admin() set schema private;

-- 2) Una sola política permissiva per rol i acció: l'escriptura dels editors deixa de cobrir SELECT.
do $$
declare t text;
begin
  foreach t in array array[
    'media', 'media_translations', 'site_settings', 'site_settings_translations', 'sections',
    'section_translations', 'accommodation_categories', 'accommodation_category_translations',
    'accommodations', 'accommodation_translations', 'accommodation_media', 'services',
    'service_translations', 'restaurants', 'restaurant_translations', 'activities',
    'activity_translations', 'testimonials', 'map_points', 'map_point_translations'
  ]
  loop
    execute format('drop policy "escriptura editors" on public.%I', t);
    execute format('create policy "editors: afegir" on public.%I for insert to authenticated
                    with check ((select private.is_editor()))', t);
    execute format('create policy "editors: modificar" on public.%I for update to authenticated
                    using ((select private.is_editor())) with check ((select private.is_editor()))', t);
    execute format('create policy "editors: esborrar" on public.%I for delete to authenticated
                    using ((select private.is_editor()))', t);
  end loop;
end;
$$;

drop policy "profiles: només l'admin els gestiona" on public.profiles;
create policy "profiles: l'admin en crea" on public.profiles
  for insert to authenticated with check ((select private.is_admin()));
create policy "profiles: l'admin en modifica" on public.profiles
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "profiles: l'admin n'esborra" on public.profiles
  for delete to authenticated using ((select private.is_admin()));

-- 3) Índexs per a les claus foranes (esborrar una imatge no ha de recórrer taules senceres).
create index on public.site_settings (logo_media_id);
create index on public.sections (media_id);
create index on public.accommodation_categories (media_id);
create index on public.accommodations (cover_media_id);
create index on public.services (icon_media_id);
create index on public.services (media_id);
create index on public.restaurants (cover_media_id);
create index on public.activities (cover_media_id);
create index on public.map_points (service_id);
create index on public.map_points (restaurant_id);
create index on public.map_points (activity_id);
create index on public.map_points (accommodation_category_key);
