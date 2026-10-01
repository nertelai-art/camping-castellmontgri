-- Registre de canvis del panell: qui ha canviat què i quan. L'escriu el panell en desar, amb la sessió de l'editor.
-- Només s'hi afegeix: no hi ha polítiques d'UPDATE ni de DELETE, així que ningú el pot reescriure des de l'API.
create table public.change_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  editor_id uuid default auth.uid() references auth.users (id) on delete set null,
  editor_name text not null,               -- còpia del nom: el registre s'ha de poder llegir encara que el compte ja no hi sigui
  entity text not null,                    -- clau de l'entitat al panell («services», «map_points»…)
  row_id text not null,
  row_name text not null,                  -- com es deia el contingut en el moment del canvi
  action text not null check (action in ('text', 'image'))
);

create index on public.change_log (created_at desc);
create index on public.change_log (editor_id);

alter table public.change_log enable row level security;
create policy "registre: els editors el llegeixen" on public.change_log
  for select to authenticated using ((select private.is_editor()));
-- Cadascú només pot signar els seus canvis.
create policy "registre: els editors hi afegeixen els seus canvis" on public.change_log
  for insert to authenticated with check ((select private.is_editor()) and editor_id = (select auth.uid()));
