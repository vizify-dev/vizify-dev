alter table projects
  add column if not exists s3_key text,
  add column if not exists s3_etag text,
  add column if not exists synced_at timestamptz,
  add column if not exists deleted_at timestamptz;

create index if not exists projects_user_idx
  on projects (user_id, updated_at desc) where deleted_at is null;

alter table projects enable row level security;

drop policy if exists "own projects select" on projects;
drop policy if exists "own projects insert" on projects;
drop policy if exists "own projects update" on projects;
drop policy if exists "own projects delete" on projects;

create policy "own projects select" on projects for select using (auth.uid() = user_id);
create policy "own projects insert" on projects for insert with check (auth.uid() = user_id);
create policy "own projects update" on projects for update using (auth.uid() = user_id);
create policy "own projects delete" on projects for delete using (auth.uid() = user_id);