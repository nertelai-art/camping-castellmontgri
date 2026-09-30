-- Proves de les polítiques RLS del contingut. Executar: pnpm db:test
begin;
select plan(12);

-- Dades de prova: un allotjament publicat, un esborrany i un usuari editor.
insert into public.accommodation_categories (key) values ('test-cat');
insert into public.accommodations (id, slug, category_key, status) values
  ('00000000-0000-0000-0000-00000000a001', 'test-publicat', 'test-cat', 'published'),
  ('00000000-0000-0000-0000-00000000a002', 'test-esborrany', 'test-cat', 'draft');
insert into public.accommodation_translations (accommodation_id, locale, name) values
  ('00000000-0000-0000-0000-00000000a001', 'es', 'Publicat'),
  ('00000000-0000-0000-0000-00000000a002', 'es', 'Esborrany');
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'editor@test.local');
insert into public.profiles (id, role) values ('00000000-0000-0000-0000-0000000000e1', 'editor');

-- ─── Visitant anònim ────────────────────────────────────────────────────────
set local role anon;

select results_eq(
  $$ select slug from public.accommodations where slug like 'test-%' $$,
  $$ values ('test-publicat') $$,
  'l''anònim només veu els allotjaments publicats'
);
select results_eq(
  $$ select name from public.accommodation_translations where accommodation_id::text like '00000000-0000-0000-0000-00000000a00%' $$,
  $$ values ('Publicat') $$,
  'l''anònim no veu les traduccions d''un esborrany'
);
select lives_ok(
  $$ update public.accommodations set sort_order = 99 where slug = 'test-publicat' $$,
  'l''UPDATE anònim no peta…'
);
reset role;
select is(
  (select sort_order from public.accommodations where slug = 'test-publicat'), 0,
  '…però no canvia res'
);
set local role anon;
select throws_ok(
  $$ insert into public.accommodation_categories (key) values ('hack') $$,
  '42501', null,
  'l''anònim no pot inserir'
);
select hasnt_function('public', 'is_editor', 'is_editor no és a l''esquema públic (no surt a /rest/v1/rpc)');

-- ─── Usuari autenticat sense perfil ─────────────────────────────────────────
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}';
select results_eq(
  $$ select count(*)::int from public.accommodations where slug like 'test-%' $$,
  $$ values (1) $$,
  'un usuari sense perfil és com un visitant'
);
select throws_ok(
  $$ insert into public.accommodation_categories (key) values ('hack') $$,
  '42501', null,
  'un usuari sense perfil no pot escriure'
);

-- ─── Editor ─────────────────────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';
select results_eq(
  $$ select count(*)::int from public.accommodations where slug like 'test-%' $$,
  $$ values (2) $$,
  'l''editor veu també els esborranys'
);
select lives_ok(
  $$ update public.accommodations set status = 'published' where slug = 'test-esborrany' $$,
  'l''editor pot publicar'
);
select is(
  (select status::text from public.accommodations where slug = 'test-esborrany'), 'published',
  'i el canvi queda desat'
);
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000e1';
reset role;
select is(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'), 'editor',
  'l''editor no es pot fer admin'
);

select * from finish();
rollback;
