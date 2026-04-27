-- ============================================================================
-- Rate limiting persistente y endurecimiento del bucket de storage.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabla rate_limits: ventana fija por (key) con count y reset_at.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

create index if not exists rate_limits_reset_at_idx on public.rate_limits (reset_at);

-- RLS: solo el service role / definer functions deben tocar esta tabla.
alter table public.rate_limits enable row level security;

-- ---------------------------------------------------------------------------
-- RPC rate_limit_hit: incrementa el contador atómicamente y devuelve estado.
-- security definer permite que el rol anon la invoque sin ver la tabla.
-- ---------------------------------------------------------------------------
create or replace function public.rate_limit_hit(
  p_key text,
  p_limit integer default 10,
  p_window_seconds integer default 60
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_record public.rate_limits%rowtype;
begin
  insert into public.rate_limits (key, count, reset_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_seconds))
  on conflict (key) do update
    set count = case
                  when public.rate_limits.reset_at < v_now then 1
                  else public.rate_limits.count + 1
                end,
        reset_at = case
                     when public.rate_limits.reset_at < v_now
                       then v_now + make_interval(secs => p_window_seconds)
                     else public.rate_limits.reset_at
                   end
  returning * into v_record;

  return query
  select v_record.count <= p_limit,
         greatest(p_limit - v_record.count, 0),
         v_record.reset_at;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public;
grant execute on function public.rate_limit_hit(text, integer, integer) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Limpieza periódica (opcional): un cron job puede llamar a rate_limits_purge.
-- ---------------------------------------------------------------------------
create or replace function public.rate_limits_purge()
returns integer
language sql
security definer
set search_path = public
as $$
  with del as (
    delete from public.rate_limits
    where reset_at < now() - interval '1 hour'
    returning 1
  )
  select count(*)::int from del;
$$;

grant execute on function public.rate_limits_purge() to service_role;

-- ---------------------------------------------------------------------------
-- Endurecer el bucket "murales": límite de 5 MB y MIME types permitidos.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from storage.buckets where id = 'murales') then
    update storage.buckets
       set file_size_limit = 5 * 1024 * 1024,
           allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
     where id = 'murales';
  else
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'murales',
      'murales',
      true,
      5 * 1024 * 1024,
      array['image/jpeg', 'image/png', 'image/webp']
    );
  end if;
end $$;
