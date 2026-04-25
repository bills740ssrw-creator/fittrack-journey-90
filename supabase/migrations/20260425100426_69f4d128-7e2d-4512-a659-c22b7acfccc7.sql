create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end; $$;

drop policy "avatars_public_read" on storage.objects;
create policy "avatars_user_read" on storage.objects for select using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
update storage.buckets set public = false where id = 'avatars';
