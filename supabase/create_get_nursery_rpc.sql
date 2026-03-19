
-- Final robust version of get_nursery_by_slug
CREATE OR REPLACE FUNCTION public.get_nursery_by_slug(target_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS '
DECLARE
    -- Declare explicit variables for profile fields to avoid Record structure issues
    p_id uuid;
    p_nursery_name text;
    p_first_name text; 
    p_last_name text;
    p_avatar_url text;
    p_specialty text;
    p_country_code text;
    
    nursery_plants json;
    license_key text;
BEGIN
    -- 1. Find profile explicitly selecting columns
    -- We select into separate variables to be 100% sure of mapping
    SELECT id, nursery_name, first_name, last_name, avatar_url, specialty, country_code
    INTO p_id, p_nursery_name, p_first_name, p_last_name, p_avatar_url, p_specialty, p_country_code
    FROM public.profiles
    WHERE LOWER(slug) = LOWER(target_slug) 
       OR id::text = target_slug
    LIMIT 1;

    IF p_id IS NULL THEN
        RETURN json_build_object(''found'', false, ''error'', ''Nursery not found. Searched for: '' || target_slug);
    END IF;

    -- 2. Resolve owner_key (License Key)
    SELECT key INTO license_key
    FROM public.access_keys
    WHERE device_id::text = p_id::text
    LIMIT 1;

    IF license_key IS NULL THEN
        license_key := p_id::text;
    END IF;

    -- 3. Fetch plants
    SELECT json_agg(p) INTO nursery_plants
    FROM public.plants p
    WHERE p.owner_key = license_key;

    RETURN json_build_object(
        ''found'', true,
        ''vivero'', json_build_object(
            ''key'', p_id,
            ''label'', COALESCE(p_nursery_name, p_first_name || '' '' || p_last_name, ''Laboratorio''),
            ''plan'', ''elite'',
            ''avatar'', p_avatar_url,
            ''specialty'', p_specialty,
            ''country'', p_country_code
        ),
        ''plants'', COALESCE(nursery_plants, ''[]''::json)
    );
EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object(''found'', false, ''error'', ''Internal Error: '' || SQLERRM);
END;
';
