
create table public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  board jsonb not null default '["","","","","","","","",""]'::jsonb,
  turn text not null default '❤️',
  winner text,
  player1_name text default 'Marigona 💖',
  player2_name text default 'Habibi 🌹',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_rooms enable row level security;

-- Public access: anyone with the room id (link) can read/update.
create policy "Anyone can read rooms" on public.game_rooms for select using (true);
create policy "Anyone can create rooms" on public.game_rooms for insert with check (true);
create policy "Anyone can update rooms" on public.game_rooms for update using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.game_rooms;
alter table public.game_rooms replica identity full;
