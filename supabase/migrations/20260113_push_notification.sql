-- Create table for Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own subscription
CREATE POLICY "Users can insert own subscription" ON push_subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view/delete their own subscription
CREATE POLICY "Users can view own subscription" ON push_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscription" ON push_subscriptions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Service Role (Edge Functions) can access all
CREATE POLICY "Service Role can access all" ON push_subscriptions
    FOR ALL
    USING (true)
    WITH CHECK (true);
