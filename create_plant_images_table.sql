-- Create table for multiple plant images
CREATE TABLE IF NOT EXISTS public.plant_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plant_id BIGINT REFERENCES public.plants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    owner_key TEXT REFERENCES public.access_keys(key) ON DELETE CASCADE
);

-- RLS Policies
ALTER TABLE public.plant_images ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public gallery)
CREATE POLICY "Public read access" ON public.plant_images
    FOR SELECT USING (true);

-- Allow owner to insert/update/delete
CREATE POLICY "Owner crud access" ON public.plant_images
    FOR ALL USING (
        owner_key IN (
            SELECT key FROM access_keys 
            WHERE device_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::uuid
        )
    );
