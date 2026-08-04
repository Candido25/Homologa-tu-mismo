ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS tier text not null default 'FREE' check (tier in ('FREE', 'PREMIUM'));

insert into public.schema_migrations (version)
values ('0003_case_tier')
on conflict (version) do nothing;
