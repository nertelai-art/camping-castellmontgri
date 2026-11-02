-- Proves de les polítiques del programa setmanal. Executar: pnpm db:test
begin;
select plan(7);

insert into public.activities (id, slug, status) values
  ('00000000-0000-0000-0000-00000000b001', 'test-publicada', 'published'),
  ('00000000-0000-0000-0000-00000000b002', 'test-esborrany', 'draft');
insert into public.activity_sessions (activity_id, day, starts_at) values
  ('00000000-0000-0000-0000-00000000b001', '2027-07-05', '10:00'),
  ('00000000-0000-0000-0000-00000000b002', '2027-07-05', '11:00');
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'editor@test.local');
insert into public.profiles (id, role) values ('00000000-0000-0000-0000-0000000000e1', 'editor');

-- ─── Visitant anònim ────────────────────────────────────────────────────────
set local role anon;
select results_eq(
  $$ select starts_at::text from public.activity_sessions where day = '2027-07-05' $$,
  $$ values ('10:00:00') $$,
  'l''anònim només veu les sessions d''activitats publicades'
);
select throws_ok(
  $$ insert into public.activity_sessions (activity_id, day, starts_at) values ('00000000-0000-0000-0000-00000000b001', '2027-07-06', '10:00') $$,
  '42501', null,
  'l''anònim no hi pot afegir res'
);

-- ─── Usuari autenticat sense perfil ─────────────────────────────────────────
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}';
select throws_ok(
  $$ insert into public.activity_sessions (activity_id, day, starts_at) values ('00000000-0000-0000-0000-00000000b001', '2027-07-06', '10:00') $$,
  '42501', null,
  'un usuari sense perfil no hi pot afegir res'
);

-- ─── Editor ─────────────────────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';
select results_eq(
  $$ select count(*)::int from public.activity_sessions where day = '2027-07-05' $$,
  $$ values (2) $$,
  'l''editor veu també les sessions dels esborranys'
);
select lives_ok(
  $$ insert into public.activity_sessions (activity_id, day, starts_at, ends_at, place) values ('00000000-0000-0000-0000-00000000b001', '2027-07-06', '10:00', '11:00', 'Piscina') $$,
  'l''editor hi afegeix una sessió'
);
select throws_ok(
  $$ insert into public.activity_sessions (activity_id, day, starts_at) values ('00000000-0000-0000-0000-00000000b001', '2027-07-06', '10:00') $$,
  '23505', null,
  'la mateixa activitat no pot sortir dues vegades a la mateixa hora'
);
select throws_ok(
  $$ insert into public.activity_sessions (activity_id, day, starts_at, ends_at) values ('00000000-0000-0000-0000-00000000b001', '2027-07-07', '12:00', '11:00') $$,
  '23514', null,
  'no pot acabar abans de començar'
);

select * from finish();
rollback;
