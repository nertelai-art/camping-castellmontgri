-- Proves de les polítiques del registre de canvis. Executar: pnpm db:test
begin;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'editor@test.local'),
  ('00000000-0000-0000-0000-0000000000e2', 'altre@test.local');
insert into public.profiles (id, role) values
  ('00000000-0000-0000-0000-0000000000e1', 'editor'),
  ('00000000-0000-0000-0000-0000000000e2', 'admin');
insert into public.change_log (editor_id, editor_name, entity, row_id, row_name, action)
  values ('00000000-0000-0000-0000-0000000000e2', 'Altre', 'services', 'x', 'Recepció', 'text');

-- ─── Visitant anònim ────────────────────────────────────────────────────────
set local role anon;
select is_empty($$ select 1 from public.change_log $$, 'l''anònim no veu el registre');
select throws_ok(
  $$ insert into public.change_log (editor_name, entity, row_id, row_name, action) values ('Ningú', 'services', 'x', 'Recepció', 'text') $$,
  '42501', null,
  'l''anònim no hi pot escriure'
);

-- ─── Usuari autenticat sense perfil ─────────────────────────────────────────
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}';
select is_empty($$ select 1 from public.change_log $$, 'un usuari sense perfil no veu el registre');

-- ─── Editor ─────────────────────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';
select lives_ok(
  $$ insert into public.change_log (editor_name, entity, row_id, row_name, action) values ('Editor', 'services', 'x', 'Recepció', 'image') $$,
  'l''editor hi afegeix un canvi, signat per defecte amb el seu compte'
);
select results_eq(
  $$ select count(*)::int from public.change_log $$,
  $$ values (2) $$,
  'l''editor veu tots els canvis, també els dels altres'
);
select throws_ok(
  $$ insert into public.change_log (editor_id, editor_name, entity, row_id, row_name, action)
     values ('00000000-0000-0000-0000-0000000000e2', 'Altre', 'services', 'x', 'Recepció', 'text') $$,
  '42501', null,
  'l''editor no pot signar un canvi en nom d''un altre'
);
update public.change_log set editor_name = 'Reescrit';
delete from public.change_log;
reset role;
select is((select count(*)::int from public.change_log), 2, 'ningú pot esborrar el registre des de l''API');
select is_empty($$ select 1 from public.change_log where editor_name = 'Reescrit' $$, 'ni reescriure''l');

select * from finish();
rollback;
