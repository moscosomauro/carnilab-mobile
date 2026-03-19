-- Enable the storage extension if not already enabled (usually enabled by default)
-- create extension if not exists "storage";

-- Create a new public bucket named 'plant-images'
insert into storage.buckets (id, name, public)
values ('plant-images', 'plant-images', true)
on conflict (id) do nothing;

-- POLICY: Allow public read access to all images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'plant-images' );

-- POLICY: Allow authenticated users to upload images
-- They can only upload to their own folder or generally if we don't enforce folder structure strictly yet.
-- For simplicity in this migration, we allow auth users to insert.
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'plant-images' and auth.role() = 'authenticated' );

-- POLICY: Allow users to update/delete their own images (optional but good)
-- This assumes we might store metadata or just rely on filename uniqueness/paths
create policy "Owner Update/Delete"
  on storage.objects for all
  using ( bucket_id = 'plant-images' and auth.uid() = owner );
