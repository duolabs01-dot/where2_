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

const inferHours = (name = '', category = '') => {
  const n = name.toLowerCase();
  const c = category.toLowerCase();

  if (n.includes('seam coffee')) return { opening_time: '06:30', closing_time: '17:30' };
  if (c.includes('coffee') || c.includes('cafe')) return { opening_time: '06:30', closing_time: '17:30' };
  if (c.includes('bar') || c.includes('club') || c.includes('nightlife')) return { opening_time: '17:00', closing_time: '02:00' };
  if (c.includes('restaurant') || c.includes('dining') || c.includes('food')) return { opening_time: '11:00', closing_time: '22:00' };
  return { opening_time: '09:00', closing_time: '21:00' };
};

const hasValidTime = (value) => typeof value === 'string' && TIME_RE.test(value.trim());

const normalizeTime = (value) => {
  if (!value || typeof value !== 'string') return null;
  const raw = value.trim().slice(0, 5);
  if (!TIME_RE.test(raw)) return null;
  return raw;
};

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
  const seamRows = rows.filter((row) => (row.name || '').toLowerCase().includes('seam coffee'));

  for (const row of rows) {
    const normalizedOpen = normalizeTime(row.opening_time);
    const normalizedClose = normalizeTime(row.closing_time);
    const inferred = inferHours(row.name, row.category);

    const opening_time = normalizedOpen || inferred.opening_time;
    const closing_time = normalizedClose || inferred.closing_time;

    const hasMissing = !hasValidTime(row.opening_time) || !hasValidTime(row.closing_time);
    const seamNeedsCorrection = (row.name || '').toLowerCase().includes('seam coffee')
      && (opening_time !== row.opening_time || closing_time !== row.closing_time);

    if (hasMissing || seamNeedsCorrection) {
      updates.push({
        id: row.id,
        name: row.name,
        previous_opening_time: row.opening_time,
        previous_closing_time: row.closing_time,
        opening_time,
        closing_time,
      });
    }
  }

  console.log(`Total places: ${rows.length}`);
  console.log(`Seam Coffee rows: ${seamRows.length}`);
  console.log(`Rows requiring hour correction: ${updates.length}`);
  console.log(JSON.stringify(updates.slice(0, 25), null, 2));

  if (!APPLY) {
    console.log('Dry run complete. Re-run with --apply to write updates.');
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
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
