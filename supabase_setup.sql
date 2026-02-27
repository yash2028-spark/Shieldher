-- ShieldHer Supabase Setup Script

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create incidents table
create table public.incidents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  description text not null,
  location text,
  date timestamp not null,
  file_path text,
  file_hash text,
  created_at timestamp default now()
);

-- 3. Enable RLS
alter table public.incidents enable row level security;

-- 4. Create Policies
create policy "Users can insert their own incidents"
on public.incidents for insert
with check (auth.uid() = user_id);

create policy "Users can select their own incidents"
on public.incidents for select
using (auth.uid() = user_id);

-- 5. Storage Setup Instructions
-- Go to Storage in Supabase Dashboard
-- Create a new bucket named "evidence"
-- Set it to "Private" (recommended for security)
-- Add Storage Policies for the "evidence" bucket:
--   Policy 1: "Allow authenticated uploads" (INSERT)
--   Policy 2: "Allow users to read their own files" (SELECT)
--   (Use path check: (storage.foldername(name))[1] = auth.uid()::text)
