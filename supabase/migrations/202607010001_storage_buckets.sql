-- Create question-images storage bucket
insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values (
  'question-images',
  'question-images',
  true,
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Allow public read access to the bucket
create policy "Public read access"
  on storage.objects
  for select
  using (bucket_id = 'question-images');

-- Allow authenticated admins to insert images
create policy "Admin insert access"
  on storage.objects
  for insert
  with check (
    bucket_id = 'question-images'
  );

-- Allow authenticated admins to delete images
create policy "Admin delete access"
  on storage.objects
  for delete
  using (bucket_id = 'question-images');
