-- Chrome3d: courses, lessons, enrolments, progress, roles and video storage.

create type public.user_role as enum ('student', 'admin');
create type public.course_level as enum ('Beginner', 'Intermediate', 'Advanced');

-- Emails listed here become admins when they sign up.
create table public.admin_emails (
  email text primary key
);
alter table public.admin_emails enable row level security;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  level public.course_level not null default 'Beginner',
  topic text not null default 'General',
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'usd',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position integer not null default 0,
  title text not null,
  body text not null default '',
  duration_seconds integer not null default 0,
  is_free boolean not null default false,
  has_video boolean not null default false,
  created_at timestamptz not null default now()
);
create index lessons_course_idx on public.lessons (course_id, position);

-- Kept apart from lessons so the storage path is only readable by people allowed to watch.
create table public.lesson_videos (
  lesson_id uuid primary key references public.lessons (id) on delete cascade,
  video_path text not null,
  updated_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  stripe_session_id text unique,
  amount_cents integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create index enrollments_course_idx on public.enrollments (course_id);

create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  last_position_seconds integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index lesson_progress_lesson_idx on public.lesson_progress (lesson_id);

-- Helpers ---------------------------------------------------------------

create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- May the current visitor watch this lesson? Free lesson, enrolled buyer, or admin.
create function public.can_view_lesson(target uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where l.id = target
      and (
        public.is_admin()
        or (
          c.published
          and (
            l.is_free
            or exists (
              select 1 from public.enrollments e
              where e.course_id = c.id and e.user_id = (select auth.uid())
            )
          )
        )
      )
  );
$$;

-- Storage objects are named <course id>/<lesson id>/<file>.
create function public.can_view_video_object(object_name text) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  lesson uuid;
begin
  begin
    lesson := (split_part(object_name, '/', 2))::uuid;
  exception when others then
    return false;
  end;
  return public.can_view_lesson(lesson);
end;
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    case
      when exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email))
        then 'admin'::public.user_role
      else 'student'::public.user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Row-level security ----------------------------------------------------

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_videos enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

create policy "admin_emails: admins manage" on public.admin_emails
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: admins update" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "courses: read published or admin" on public.courses
  for select to anon, authenticated using (published or public.is_admin());
create policy "courses: admins insert" on public.courses
  for insert to authenticated with check (public.is_admin());
create policy "courses: admins update" on public.courses
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "courses: admins delete" on public.courses
  for delete to authenticated using (public.is_admin());

-- Lesson titles and notes outline are public for published courses (the curriculum).
create policy "lessons: read published or admin" on public.lessons
  for select to anon, authenticated using (
    public.is_admin()
    or exists (select 1 from public.courses c where c.id = course_id and c.published)
  );
create policy "lessons: admins insert" on public.lessons
  for insert to authenticated with check (public.is_admin());
create policy "lessons: admins update" on public.lessons
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "lessons: admins delete" on public.lessons
  for delete to authenticated using (public.is_admin());

create policy "lesson_videos: read if allowed to watch" on public.lesson_videos
  for select to anon, authenticated using (public.can_view_lesson(lesson_id));
create policy "lesson_videos: admins insert" on public.lesson_videos
  for insert to authenticated with check (public.is_admin());
create policy "lesson_videos: admins update" on public.lesson_videos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "lesson_videos: admins delete" on public.lesson_videos
  for delete to authenticated using (public.is_admin());

create policy "enrollments: read own or admin" on public.enrollments
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
-- Paid enrolments are written by the Stripe webhook (service role). Free courses can be joined directly.
create policy "enrollments: join free courses" on public.enrollments
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and stripe_session_id is null
    and amount_cents = 0
    and exists (
      select 1 from public.courses c where c.id = course_id and c.published and c.price_cents = 0
    )
  );

create policy "lesson_progress: read own" on public.lesson_progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy "lesson_progress: insert own" on public.lesson_progress
  for insert to authenticated with check (
    user_id = (select auth.uid()) and public.can_view_lesson(lesson_id)
  );
create policy "lesson_progress: update own" on public.lesson_progress
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Video storage ---------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('course-videos', 'course-videos', false)
on conflict (id) do nothing;

create policy "course videos: watch if allowed" on storage.objects
  for select to anon, authenticated using (
    bucket_id = 'course-videos' and public.can_view_video_object(name)
  );
create policy "course videos: admins upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'course-videos' and public.is_admin());
create policy "course videos: admins replace" on storage.objects
  for update to authenticated using (bucket_id = 'course-videos' and public.is_admin())
  with check (bucket_id = 'course-videos' and public.is_admin());
create policy "course videos: admins delete" on storage.objects
  for delete to authenticated using (bucket_id = 'course-videos' and public.is_admin());
