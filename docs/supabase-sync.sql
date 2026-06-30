-- GRE Vocab L2 Companion: personal cloud snapshot sync.
-- Chạy file này trong Supabase SQL Editor.
--
-- Client chỉ gọi 2 RPC gre_l2_push / gre_l2_pull bằng anon key.
-- Table bật RLS và không mở policy trực tiếp; function SECURITY DEFINER kiểm tra
-- profile_id + sync_secret.

create table if not exists public.gre_l2_snapshots (
  profile_id text primary key,
  sync_secret text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.gre_l2_snapshots enable row level security;

create or replace function public.gre_l2_pull(
  p_profile_id text,
  p_sync_secret text
)
returns table(payload jsonb, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select s.payload, s.updated_at
  from public.gre_l2_snapshots s
  where s.profile_id = p_profile_id
    and s.sync_secret = p_sync_secret
  limit 1;
$$;

create or replace function public.gre_l2_push(
  p_profile_id text,
  p_sync_secret text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.gre_l2_snapshots
    where profile_id = p_profile_id
      and sync_secret <> p_sync_secret
  ) then
    raise exception 'Invalid sync secret';
  end if;

  insert into public.gre_l2_snapshots (profile_id, sync_secret, payload, updated_at)
  values (p_profile_id, p_sync_secret, p_payload, now())
  on conflict (profile_id) do update
    set payload = excluded.payload,
        updated_at = now()
    where public.gre_l2_snapshots.sync_secret = excluded.sync_secret;
end;
$$;

grant execute on function public.gre_l2_pull(text, text) to anon;
grant execute on function public.gre_l2_push(text, text, jsonb) to anon;

-- Nếu REST/RPC vẫn báo 404 ngay sau khi tạo function, reload schema cache.
notify pgrst, 'reload schema';
