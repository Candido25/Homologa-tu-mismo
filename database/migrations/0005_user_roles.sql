ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS role text not null default 'USER'
  check (role in ('USER', 'ADVISOR', 'ADMIN'));

insert into public.schema_migrations (version)
values ('0005_user_roles')
on conflict (version) do nothing;
