create table if not exists public.attendance_responses (
  id uuid primary key default gen_random_uuid(),
  teacher_name text not null,
  section_name text not null,
  course_name text not null,
  attendance_date date not null,
  lesson_number integer not null check (lesson_number >= 1),
  present_count integer not null check (present_count >= 0),
  absent_count integer not null check (absent_count >= 0),
  absentee_names text[] not null default '{}',
  submitted_at timestamptz not null default now(),
  constraint absentee_names_match_count
    check (coalesce(array_length(absentee_names, 1), 0) = absent_count)
);

alter table public.attendance_responses enable row level security;
revoke all on table public.attendance_responses from anon, authenticated;
