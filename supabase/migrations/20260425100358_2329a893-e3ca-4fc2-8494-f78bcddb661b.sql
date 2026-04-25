-- Enums
create type public.fitness_goal as enum ('lose_weight','build_strength','stay_active');

-- Profiles
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  goal public.fitness_goal,
  weekly_target int check (weekly_target between 1 and 7),
  reminder_time time,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = user_id);

-- updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (user_id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Cardio sessions
create table public.cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('run','walk','cycle','other')),
  duration_minutes int not null check (duration_minutes > 0),
  distance_km numeric(6,2) not null default 0 check (distance_km >= 0),
  calories int not null default 0 check (calories >= 0),
  notes text,
  logged_at timestamptz not null default now()
);
create index on public.cardio_sessions (user_id, logged_at desc);
alter table public.cardio_sessions enable row level security;
create policy "cardio_select_own" on public.cardio_sessions for select using (auth.uid() = user_id);
create policy "cardio_insert_own" on public.cardio_sessions for insert with check (auth.uid() = user_id);
create policy "cardio_update_own" on public.cardio_sessions for update using (auth.uid() = user_id);
create policy "cardio_delete_own" on public.cardio_sessions for delete using (auth.uid() = user_id);

-- Workout sessions
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_name text not null,
  logged_at timestamptz not null default now()
);
create index on public.workout_sessions (user_id, logged_at desc);
alter table public.workout_sessions enable row level security;
create policy "ws_select_own" on public.workout_sessions for select using (auth.uid() = user_id);
create policy "ws_insert_own" on public.workout_sessions for insert with check (auth.uid() = user_id);
create policy "ws_update_own" on public.workout_sessions for update using (auth.uid() = user_id);
create policy "ws_delete_own" on public.workout_sessions for delete using (auth.uid() = user_id);

-- Workout exercises
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_name text not null,
  sets int not null check (sets > 0),
  reps int not null check (reps > 0),
  weight_kg numeric(6,2) not null default 0 check (weight_kg >= 0),
  position int not null default 0
);
create index on public.workout_exercises (session_id);
alter table public.workout_exercises enable row level security;
create policy "we_select_own" on public.workout_exercises for select using (
  exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "we_insert_own" on public.workout_exercises for insert with check (
  exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "we_update_own" on public.workout_exercises for update using (
  exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "we_delete_own" on public.workout_exercises for delete using (
  exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
);

-- Avatars bucket
insert into storage.buckets (id, name, public) values ('avatars','avatars',true);
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_user_insert" on storage.objects for insert with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "avatars_user_update" on storage.objects for update using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "avatars_user_delete" on storage.objects for delete using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
