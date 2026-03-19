
-- THIS SCRIPT WIPES ALL PUBLIC NURSERIES FROM THE MAP
-- Use this ONLY to clean up test data before production launch.

-- Option 1: Delete ALL public nurseries (except perhaps your own ID if you want to keep it)
-- Replace 'YOUR_USER_ID' with your actual UUID if you want to safe-keep your own profile.
-- DELETE FROM profiles WHERE is_nursery_public = TRUE AND id != 'YOUR_USER_ID';

-- Option 2: Delete ALL public nurseries (Complete Wipe)
UPDATE profiles 
SET 
  is_nursery_public = FALSE, 
  nursery_name = NULL, 
  specialty = NULL, 
  country_code = NULL 
WHERE is_nursery_public = TRUE;

-- This removes them from the map but keeps the user accounts active.
-- If you want to delete the user profiles entirely from the database (careful!):
-- DELETE FROM profiles WHERE is_nursery_public = TRUE;
