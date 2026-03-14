/**
 * CHANGE NAVIGATOR — Supabase Storage Configuration
 * ==================================================
 *
 * SETUP STEPS:
 * 1. Create a project at https://supabase.com
 * 2. Go to Storage → New bucket:
 *    • Name: "cards-he"  →  Toggle "Public bucket" ON
 *    • Name: "cards-en"  →  Toggle "Public bucket" ON
 * 3. Upload card images with the naming convention:
 *      {number}F.png  = front face  (e.g. 1F.png, 2F.png … 54F.png)
 *      {number}B.png  = back face   (e.g. 1B.png, 2B.png … 54B.png)
 *    Hebrew deck → bucket "cards-he"
 *    English deck → bucket "cards-en"
 * 4. Find your Project URL:
 *    Supabase Dashboard → Settings → API → Project URL
 *    It looks like: https://abcdefghijklmnop.supabase.co
 * 5. Replace YOUR_PROJECT_REF below with your actual project reference.
 *
 * You can also upload images directly from the Admin panel (admin.html)
 * once you add your Supabase credentials there.
 */

// ─── Your Supabase project URL ───────────────────────────────────────────────
window.SUPABASE_URL = 'https://knwtuilsyrwxvnyzamkh.supabase.co';

// ─── Supabase anon/public key ─────────────────────────────────────────────────
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtud3R1aWxzeXJ3eHZueXphbWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTA5NDAsImV4cCI6MjA4ODU2Njk0MH0.eVpPIJo-Pm8lF4vA7WL8Pn30LBc9gpzRWNuwu_r7gNk';

// ─── Derived storage base URL (do not edit) ──────────────────────────────────
window.SUPABASE_STORAGE_BASE = window.SUPABASE_URL + '/storage/v1/object/public';

// ─── App configuration ───────────────────────────────────────────────────────
window.CARD_CONFIG = {
  buckets: { he: 'cards-he', en: 'cards-en' },
  total: 54,
};
