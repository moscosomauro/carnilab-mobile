
-- 1. Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow PUBLIC access to view files (SELECT)
CREATE POLICY "Public Profiles can view avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Allow AUTHENTICATED users to upload files (INSERT)
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 4. Allow Users to Update their own files (UPDATE)
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

-- 5. Allow Users to Delete their own files (DELETE)
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
