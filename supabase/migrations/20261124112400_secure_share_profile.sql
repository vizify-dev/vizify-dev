create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, plan)
  values (new.id, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.get_public_resume(p_id uuid)
returns table (csv text, css text, theme_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.csv, p.css, p.theme_id
  from public.projects p
  where p.id = p_id
    and p.view = 'resume'
  limit 1;
$$;

revoke all on function public.get_public_resume(uuid) from public;
grant execute on function public.get_public_resume(uuid) to anon, authenticated;
