-- Proves de les polítiques de la galeria de la portada. Executar: pnpm db:test
begin;
select plan(4);

insert into public.media (id, path, mime_type) values ('00000000-0000-0000-0000-00000000c001', 'test/galeria.jpg', 'image/jpeg');
insert into public.sections (key) values ('test-galeria');
insert into public.section_media (section_key, media_id) values ('test-galeria', '00000000-0000-0000-0000-00000000c001');
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'editor@test.local');
insert into public.profiles (id, role) values ('00000000-0000-0000-0000-0000000000e1', 'editor');

set local role anon;
select results_eq(
  $$ select count(*)::int from public.section_media where section_key = 'test-galeria' $$,
  $$ values (1) $$,
  'l''anònim veu la galeria'
);
select throws_ok(
  $$ insert into public.section_media (section_key, media_id) values ('gallery', '00000000-0000-0000-0000-00000000c001') $$,
  '42501', null,
  'l''anònim no hi pot afegir fotos'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}';
select throws_ok(
  $$ insert into public.section_media (section_key, media_id) values ('gallery', '00000000-0000-0000-0000-00000000c001') $$,
  '42501', null,
  'un usuari sense perfil no hi pot afegir fotos'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';
select lives_ok(
  $$ delete from public.section_media where section_key = 'test-galeria' $$,
  'l''editor en pot treure'
);

select * from finish();
rollback;
