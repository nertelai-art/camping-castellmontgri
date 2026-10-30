-- El punt de la foto que no s'ha de retallar mai, en % des de l'esquerra i des de dalt. La web el fa servir d'`object-position`.
alter table public.media
  add column focus_x numeric(5, 2) not null default 50 check (focus_x between 0 and 100),
  add column focus_y numeric(5, 2) not null default 50 check (focus_y between 0 and 100);
