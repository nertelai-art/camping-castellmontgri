-- Proves de les polítiques de les notes de les plataformes de ressenyes. Executar: pnpm db:test
begin;
select plan(5);

insert into public.review_platforms (id, platform, rating, scale, status) values
  ('00000000-0000-0000-0000-00000000d001', 'Publicada', 8.0, 10, 'published'),
  ('00000000-0000-0000-0000-00000000d002', 'Esborrany', 4.0, 5, 'draft');
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'editor@test.local');
insert into public.profiles (id, role) values ('00000000-0000-0000-0000-0000000000e1', 'editor');

select throws_ok(
  $$ insert into public.review_platforms (platform, rating, scale) values ('Massa', 9.0, 5) $$,
  '23514', null,
  'la nota no pot passar de l''escala'
);

set local role anon;
select results_eq(
  $$ select platform from public.review_platforms where id in ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d002') $$,
  $$ values ('Publicada') $$,
  'l''anònim només veu les publicades'
);
select throws_ok(
  $$ insert into public.review_platforms (platform, rating) values ('Falsa', 10) $$,
  '42501', null,
  'l''anònim no hi pot afegir notes'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}';
select throws_ok(
  $$ insert into public.review_platforms (platform, rating) values ('Falsa', 10) $$,
  '42501', null,
  'un usuari sense perfil no hi pot afegir notes'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';
select results_eq(
  $$ update public.review_platforms set rating = 9.1 where id = '00000000-0000-0000-0000-00000000d001' returning rating $$,
  $$ values (9.1::numeric(3, 1)) $$,
  'l''editor la pot posar al dia'
);

select * from finish();
rollback;
