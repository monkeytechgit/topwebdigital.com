-- Top Web Digital — ajustes a public.contact_leads para los formularios del sitio
-- Ejecutar UNA vez en Supabase → SQL Editor. Es seguro volver a correrlo.

-- 1) Los formularios del sitio piden nombre + WhatsApp; correo, empresa y mensaje son opcionales
alter table public.contact_leads alter column company drop not null;
alter table public.contact_leads alter column email drop not null;
alter table public.contact_leads alter column process_problem drop not null;

-- 2) Columnas nuevas para saber de dónde viene cada lead
alter table public.contact_leads add column if not exists source text not null default 'contacto';  -- contacto | cotizador
alter table public.contact_leads add column if not exists industry text;       -- giro del negocio
alter table public.contact_leads add column if not exists quote_summary text;  -- respuestas + rango del cotizador
alter table public.contact_leads add column if not exists lang text;           -- es | en
alter table public.contact_leads add column if not exists page_url text;       -- página desde donde se envió

do $$ begin
  alter table public.contact_leads add constraint contact_leads_source_chk check (source in ('contacto', 'cotizador'));
exception when duplicate_object then null; end $$;

-- Límites de tamaño para frenar spam / abuso
do $$ begin
  alter table public.contact_leads add constraint contact_leads_len_chk check (
    char_length(full_name) between 1 and 120
    and coalesce(char_length(company), 0) <= 160
    and coalesce(char_length(email), 0) <= 160
    and coalesce(char_length(phone), 0) <= 40
    and coalesce(char_length(process_problem), 0) <= 3000
    and coalesce(char_length(industry), 0) <= 80
    and coalesce(char_length(quote_summary), 0) <= 3000
    and coalesce(char_length(page_url), 0) <= 500
  );
exception when duplicate_object then null; end $$;

-- 3) updated_at automático
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists contact_leads_updated_at on public.contact_leads;
create trigger contact_leads_updated_at before update on public.contact_leads
  for each row execute function public.set_updated_at();

-- 4) Seguridad: el sitio (llave publishable = rol anon) SOLO puede insertar leads nuevos.
--    No puede leer, editar ni borrar. Tú los ves desde el panel de Supabase.
alter table public.contact_leads enable row level security;
revoke all on public.contact_leads from anon;
grant insert on public.contact_leads to anon;

drop policy if exists "web_insert_leads" on public.contact_leads;
create policy "web_insert_leads" on public.contact_leads
  for insert to anon
  with check (status = 'new' and current_impact = '{}'::text[]);

create index if not exists contact_leads_created_at_idx on public.contact_leads (created_at desc);
