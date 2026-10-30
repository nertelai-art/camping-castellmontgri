-- El programa setmanal d'animació: quina activitat es fa quin dia i a quina hora. El nom surt de l'activitat (en 5 idiomes);
-- el lloc s'escriu una sola vegada perquè és un nom propi («Piscina Ombra»).
create table public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  day date not null,
  starts_at time not null,
  ends_at time,
  place text,
  created_at timestamptz not null default now(),
  unique (activity_id, day, starts_at),
  check (ends_at is null or ends_at > starts_at)
);
create index on public.activity_sessions (day, starts_at);

alter table public.activity_sessions enable row level security;
-- RLS d'`activities` ja amaga els esborranys a qui no edita: una sessió només es veu si es veu la seva activitat.
create policy "lectura si es veu l'activitat" on public.activity_sessions for select to anon, authenticated
  using (exists (select 1 from public.activities a where a.id = activity_id));
create policy "editors: afegir" on public.activity_sessions for insert to authenticated with check ((select private.is_editor()));
create policy "editors: modificar" on public.activity_sessions for update to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));
create policy "editors: esborrar" on public.activity_sessions for delete to authenticated using ((select private.is_editor()));

-- El registre de canvis també apunta els canvis del programa.
alter table public.change_log drop constraint change_log_action_check;
alter table public.change_log add constraint change_log_action_check check (action in ('text', 'image', 'create', 'delete', 'programme'));
