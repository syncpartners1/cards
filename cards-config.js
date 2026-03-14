/**
 * CHANGE NAVIGATOR — Supabase Configuration
 * ==========================================
 *
 * Project:   https://knwtuilsyrwxvnyzamkh.supabase.co
 * Dashboard: https://supabase.com/dashboard/project/knwtuilsyrwxvnyzamkh
 *
 * ── Client-side (used by this app) ───────────────────────────────────────────
 *   API URL:  https://knwtuilsyrwxvnyzamkh.supabase.co
 *   Anon key: see SUPABASE_ANON_KEY below (safe to expose — public bucket access only)
 *
 * ── Direct database connection (server-side / Railway env vars only) ─────────
 *   postgresql://postgres:[PASSWORD]@db.knwtuilsyrwxvnyzamkh.supabase.co:5432/postgres
 *   ⚠ Never put the real password in client-side code — use Railway environment variables.
 *
 * ── Storage buckets ──────────────────────────────────────────────────────────
 *   cards-he  (public)  — Hebrew card images
 *   cards-en  (public)  — English card images
 *   Naming: {number}F.png = front, {number}B.png = back  (e.g. 1F.png … 54B.png)
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
