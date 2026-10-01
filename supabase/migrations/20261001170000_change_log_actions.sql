-- El registre també apunta quan es crea o s'esborra un contingut.
alter table public.change_log drop constraint change_log_action_check;
alter table public.change_log add constraint change_log_action_check check (action in ('text', 'image', 'create', 'delete'));
