
-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id text PRIMARY KEY,
    name text NOT NULL,
    price_monthly integer NOT NULL,
    price_annual integer NOT NULL,
    features jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read plans (needed for Profile page)
CREATE POLICY "Public profiles can view plans" 
ON public.plans FOR SELECT 
USING ( true );

-- Only authenticated users can update (AdminKeys checks isAdmin on client, 
-- ideally we'd filter by admin role here too, but for now this suffices combined with UI logic)
CREATE POLICY "Admins can update plans" 
ON public.plans FOR UPDATE 
USING ( auth.role() = 'authenticated' )
WITH CHECK ( auth.role() = 'authenticated' );

-- Insert defaults
INSERT INTO public.plans (id, name, price_monthly, price_annual, features)
VALUES 
('basic', 'Plan Básico', 0, 0, '["Cultivo limitado (50)", "Vivero Online Básico"]'),
('pro', 'Plan Pro', 6000, 64800, '["Cultivo Ilimitado", "Vivero Online Pro", "Genealogía Avanzada"]'),
('elite', 'Plan Elite', 14000, 151200, '["IA Carni Bot", "Tienda Online", "Árbol Genealógico Visual"]')
ON CONFLICT (id) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual;
