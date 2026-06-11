create table if not exists employees (
  id bigserial primary key,
  name text not null unique,
  display_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists matches (
  id text primary key,
  group_name text not null,
  team_a text not null,
  team_b text not null,
  position integer not null,
  created_at timestamptz default now()
);

create table if not exists predictions (
  id bigserial primary key,
  employee_id bigint references employees(id) on delete cascade,
  match_id text references matches(id) on delete cascade,
  score_a integer,
  score_b integer,
  updated_at timestamptz default now(),
  unique(employee_id, match_id)
);

create table if not exists results (
  match_id text primary key references matches(id) on delete cascade,
  score_a integer not null,
  score_b integer not null,
  played_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table employees enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table results enable row level security;

drop policy if exists "Public read employees" on employees;
create policy "Public read employees" on employees for select using (true);
drop policy if exists "Public read matches" on matches;
create policy "Public read matches" on matches for select using (true);
drop policy if exists "Public read predictions" on predictions;
create policy "Public read predictions" on predictions for select using (true);
drop policy if exists "Public read results" on results;
create policy "Public read results" on results for select using (true);
