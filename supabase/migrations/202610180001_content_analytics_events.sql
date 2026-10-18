-- RaportFinansowy24: content attribution and revenue funnel
-- Apply in Supabase SQL Editor before enabling the tracking snippet in production.
create table if not exists public.content_analytics_events (
  id uuid primary key,
  event_name text not null check (event_name in ('page_view','affiliate_click','lead_submit','affiliate_conversion')),
  visitor_id text,
  video_id text,
  hook_id text,
  platform text,
  topic text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  clickid text,
  page_path text,
  value numeric(12,2),
  is_test boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists content_analytics_events_created_at_idx on public.content_analytics_events (created_at desc);
create index if not exists content_analytics_events_clickid_idx on public.content_analytics_events (clickid) where clickid is not null;
create index if not exists content_analytics_events_content_idx on public.content_analytics_events (video_id, hook_id, platform);
alter table public.content_analytics_events enable row level security;
-- Public event ingestion is intentionally insert-only. Reports require a server-side service-role key.
drop policy if exists "content_analytics_public_insert" on public.content_analytics_events;
create policy "content_analytics_public_insert"
  on public.content_analytics_events
  for insert to anon, authenticated
  with check (
    event_name in ('page_view','affiliate_click','lead_submit')
    and (value is null or value >= 0)
  );

-- A click may produce at most one recorded affiliate conversion in the reporting table.
create unique index if not exists content_analytics_one_conversion_per_click_idx
  on public.content_analytics_events (clickid)
  where event_name = 'affiliate_conversion' and clickid is not null;
