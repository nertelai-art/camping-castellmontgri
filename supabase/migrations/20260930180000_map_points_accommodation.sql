-- Un punt del plànol pot assenyalar un allotjament concret (p. ex. les parcel·les Comodity Plus),
-- no només una categoria sencera.
alter table public.map_points
  add column accommodation_id uuid references public.accommodations (id) on delete cascade;

create index on public.map_points (accommodation_id);
