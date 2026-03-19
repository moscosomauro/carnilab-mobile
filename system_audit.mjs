
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://szscgmqkcwlzceyisbpi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6c2NnbXFrY3dsemNleWlzYnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzE5NDQsImV4cCI6MjA3OTk0Nzk0NH0.oIUV9doUFs2Rpa0iC1PD4X8TdGkubx_yQlntfnry0io';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAudit() {
    console.log("🔍 -- SYSTEM AUDIT STARTED --\n");

    // 1. DATABASE CONNECTIVITY
    console.log("1. [CHECK] Database Connectivity...");
    const { data: health, error: healthError } = await supabase.from('profiles').select('id').limit(1);
    if (healthError) {
        console.error("❌ [FAIL] Database connection failed:", healthError.message);
    } else {
        console.log("✅ [PASS] Database connection active.");
    }

    // 2. CRITICAL TABLES CHECK
    console.log("\n2. [CHECK] Critical Tables Existence...");
    const tables = ['profiles', 'access_keys', 'plants', 'crosses', 'conversations'];
    for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.code !== 'PGRST116') { // Ignore empty result error, care about table existence
            if (error.message.includes('does not exist')) {
                console.error(`❌ [FAIL] Table '${table}' MISSING!`);
            } else {
                console.log(`✅ [PASS] Table '${table}' detected.`);
            }
        } else {
            console.log(`✅ [PASS] Table '${table}' detected.`);
        }
    }

    // 3. STORAGE BUCKETS
    console.log("\n3. [CHECK] Storage Configuration...");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error("❌ [FAIL] Could not list buckets:", bucketError.message);
    } else {
        const requiredBuckets = ['avatars', 'plant-images'];
        const foundBuckets = buckets.map(b => b.name);

        requiredBuckets.forEach(req => {
            if (foundBuckets.includes(req)) {
                const b = buckets.find(x => x.name === req);
                console.log(`✅ [PASS] Bucket '${req}' exists (Public: ${b.public}).`);
            } else {
                console.error(`❌ [FAIL] Bucket '${req}' is MISSING.`);
            }
        });
    }

    // 4. DATA INTEGRITY (Basic)
    console.log("\n4. [CHECK] Data Integrity Sample...");
    // Check if profiles have avatars
    const { data: profiles } = await supabase.from('profiles').select('id, avatar, nursery_name').limit(5);
    if (profiles && profiles.length > 0) {
        profiles.forEach(p => {
            if (!p.avatar) console.warn(`⚠️ [WARN] Profile ${p.nursery_name || p.id} has no avatar.`);
            else console.log(`ℹ️ [INFO] Profile ${p.nursery_name} ok.`);
        });
    } else {
        console.log("ℹ️ [INFO] No profiles to check (Table empty is ok for fresh start).");
    }

    console.log("\n🔍 -- AUDIT COMPLETE --");
}

runAudit();
