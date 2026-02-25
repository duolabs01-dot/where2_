import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('--apply');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const normalizeName = (value = '') => value.toLowerCase().replace(/\s+/g, ' ').trim();

const hasValidTime = (value) => typeof value === 'string' && TIME_RE.test(value.trim());

const normalizeTime = (value) => {
  if (!value || typeof value !== 'string') return null;
  const raw = value.trim().slice(0, 5);
  if (!TIME_RE.test(raw)) return null;
  return raw;
};

// Explicit corrections only; no category-based inference.
const EXPLICIT_HOURS_BY_NAME = new Map([
  ['seam coffee', { opening_time: '06:30', closing_time: '17:30' }],
]);

const run = async () => {
  const { data, error } = await supabase
    .from('places')
    .select('id,name,category,city,address,opening_time,closing_time')
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch places:', error.message);
    process.exit(1);
  }

  const rows = data || [];
  const updates = [];
  const unresolved = [];
  const seamRows = rows.filter((row) => normalizeName(row.name || '').includes('seam coffee'));

  for (const row of rows) {
    const open = normalizeTime(row.opening_time);
    const close = normalizeTime(row.closing_time);
    const nameKey = normalizeName(row.name || '');
    const explicit = EXPLICIT_HOURS_BY_NAME.get(nameKey);

    const needsFix = !hasValidTime(row.opening_time) || !hasValidTime(row.closing_time);
    if (!needsFix && !explicit) continue;

    if (explicit) {
      const nextOpen = explicit.opening_time;
      const nextClose = explicit.closing_time;
      if (open !== nextOpen || close !== nextClose) {
        updates.push({
          id: row.id,
          name: row.name,
          previous_opening_time: row.opening_time,
          previous_closing_time: row.closing_time,
          opening_time: nextOpen,
          closing_time: nextClose,
          reason: 'explicit-name-rule',
        });
      }
      continue;
    }

    unresolved.push({
      id: row.id,
      name: row.name,
      category: row.category,
      city: row.city,
      address: row.address,
      opening_time: row.opening_time,
      closing_time: row.closing_time,
      reason: 'missing-or-invalid-time-no-explicit-rule',
    });
  }

  console.log(`Total places: ${rows.length}`);
  console.log(`Seam Coffee rows: ${seamRows.length}`);
  console.log(`Rows with explicit updates: ${updates.length}`);
  console.log(`Rows still unresolved: ${unresolved.length}`);
  console.log('--- Explicit updates (preview) ---');
  console.log(JSON.stringify(updates.slice(0, 25), null, 2));
  console.log('--- Unresolved rows (preview) ---');
  console.log(JSON.stringify(unresolved.slice(0, 50), null, 2));

  if (!APPLY) {
    console.log('Dry run complete. Re-run with --apply to write explicit updates only.');
    return;
  }

  let success = 0;
  let failed = 0;

  for (const patch of updates) {
    const { error: updateError } = await supabase
      .from('places')
      .update({
        opening_time: patch.opening_time,
        closing_time: patch.closing_time,
      })
      .eq('id', patch.id);

    if (updateError) {
      failed += 1;
      console.error(`Failed updating ${patch.name} (${patch.id}): ${updateError.message}`);
    } else {
      success += 1;
    }
  }

  console.log(`Update complete. Success: ${success}, Failed: ${failed}`);
  if (unresolved.length > 0) {
    console.log('Some rows still need manual operating-hour updates (see unresolved preview above).');
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
