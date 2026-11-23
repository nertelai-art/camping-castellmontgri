-- Proves de les polítiques dels assistents de «El teu viatge, amb la IA». Executar: pnpm db:test
begin;
select plan(6);

update public.trip_assistants set status = 'draft' where key = 'gemini';
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'editor@test.local');
insert into public.profiles (id, role) values ('00000000-0000-0000-0000-0000000000e1', 'editor');

select throws_ok(
  $$ insert into public.trip_assistants (key, name) values ('copilot', 'Copilot') $$,
  '23514', null,
  'només hi ha els assistents que la web sap obrir'
);

set local role anon;
select results_eq(
  $$ select key from public.trip_assistants order by sort_order $$,
  $$ values ('chatgpt'), ('claude') $$,
  'l''anònim no veu els assistents amagats'
);
select is(
  (select count(*)::int from public.trip_assistant_translations where assistant_key = 'gemini'),
  0,
  'ni els textos d''un assistent amagat'
);
select throws_ok(
  $$ insert into public.trip_assistant_translations (assistant_key, locale, greeting) values ('gemini', 'ca', 'Hola') $$,
  '42501', null,
  'l''anònim no hi pot escriure'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}';
select is_empty(
  $$ update public.trip_assistant_translations set greeting = 'Hola' where assistant_key = 'chatgpt' returning greeting $$,
  'un usuari sense perfil no hi pot escriure'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';
select results_eq(
  $$ update public.trip_assistant_translations set greeting = 'Hola!' where assistant_key = 'gemini' and locale = 'ca' returning greeting $$,
  $$ values ('Hola!') $$,
  'l''editor pot editar fins i tot un assistent amagat'
);

select * from finish();
rollback;
