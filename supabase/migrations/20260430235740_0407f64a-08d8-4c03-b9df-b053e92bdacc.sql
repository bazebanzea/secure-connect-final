
-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- MFA factors table
create table public.mfa_factors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  factor_type text not null default 'totp',
  friendly_name text not null,
  secret text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
alter table public.mfa_factors enable row level security;

create policy "Users view own factors" on public.mfa_factors
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own factors" on public.mfa_factors
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own factors" on public.mfa_factors
  for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own factors" on public.mfa_factors
  for delete to authenticated using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
