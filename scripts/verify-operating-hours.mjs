// scripts/verify-operating-hours.mjs
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

const normalizeName = (value = '') => value.toLowerCase().replace(/\s+/g, ' ').trim();

// Explicit hours for venues that need to be fixed.
// 1 = Monday, 7 = Sunday
const EXPLICIT_HOURS_BY_NAME = new Map([
  ['seam coffee', [
    { day_of_week: 1, open_time: '06:30:00', close_time: '17:30:00' },
    { day_of_week: 2, open_time: '06:30:00', close_time: '17:30:00' },
    { day_of_week: 3, open_time: '06:30:00', close_time: '17:30:00' },
    { day_of_week: 4, open_time: '06:30:00', close_time: '17:30:00' },
    { day_of_week: 5, open_time: '06:30:00', close_time: '17:30:00' },
    { day_of_week: 6, open_time: '07:30:00', close_time: '15:00:00' },
    { day_of_week: 7, open_time: '07:30:00', close_time: '15:00:00' },
  ]],
  ['lion\'s head', { is_24_7: true }],
  ['north beach skate park', { is_24_7: true }],
  ['umhlanga promenade', { is_24_7: true }],
  ['durban botanic gardens', { is_24_7: true }],
  ['boulders beach', { is_24_7: true }],
  ['cape of good hope', { is_24_7: true }],
  ['austin roberts bird sanctuary', { is_24_7: true }],
]);

const run = async () => {
  const { data: places, error: placesError } = await supabase
    .from('places')
    .select('id, name, is_24_7')
    .order('name', { ascending: true });

  if (placesError) {
    console.error('Failed to fetch places:', placesError.message);
    process.exit(1);
  }

  const { data: allOperatingHours, error: hoursError } = await supabase
    .from('operating_hours')
    .select('place_id, day_of_week, open_time, close_time');

  if (hoursError) {
    console.error('Failed to fetch operating hours:', hoursError.message);
    process.exit(1);
  }

  const hoursByPlaceId = new Map();
  for (const oh of allOperatingHours) {
    if (!hoursByPlaceId.has(oh.place_id)) {
      hoursByPlaceId.set(oh.place_id, []);
    }
    hoursByPlaceId.get(oh.place_id).push(oh);
  }

  const unresolved = [];
  const updates = [];

  for (const place of places) {
    const nameKey = normalizeName(place.name);
    const hasHours = hoursByPlaceId.has(place.id) && hoursByPlaceId.get(place.id).length > 0;

    // Check if the venue is valid (either 24/7 or has hours)
    if (place.is_24_7 || hasHours) {
      continue;
    }
    
    const explicitFix = EXPLICIT_HOURS_BY_NAME.get(nameKey);
    if (explicitFix) {
        updates.push({
            id: place.id,
            name: place.name,
            fix: explicitFix,
        });
    } else {
        unresolved.push({
            id: place.id,
            name: place.name,
            reason: 'Not 24/7 and has no operating hours entries.',
        });
    }
  }

  console.log(`Total places: ${places.length}`);
  console.log(`Rows with explicit updates to apply: ${updates.length}`);
  console.log(`Rows still unresolved: ${unresolved.length}`);
  console.log('--- Explicit updates (preview) ---');
  console.log(JSON.stringify(updates.slice(0, 25), null, 2));
  console.log('--- Unresolved rows (preview) ---');
  console.log(JSON.stringify(unresolved.slice(0, 50), null, 2));

  if (!APPLY) {
    console.log('Dry run complete. Re-run with --apply to apply explicit fixes.');
    return;
  }

  let successCount = 0;
  let failedCount = 0;

  for (const patch of updates) {
    if (patch.fix.is_24_7) {
        // Handle 24/7 flag update
        const { error } = await supabase
            .from('places')
            .update({ is_24_7: true })
            .eq('id', patch.id);
        if (error) {
            failedCount++;
            console.error(`Failed to update ${patch.name} to 24/7: ${error.message}`);
        } else {
            successCount++;
        }
    } else if (Array.isArray(patch.fix)) {
        // Handle inserting operating hours
        const hoursToInsert = patch.fix.map(h => ({ ...h, place_id: patch.id }));
        const { error } = await supabase.from('operating_hours').insert(hoursToInsert);
        if (error) {
            failedCount++;
            console.error(`Failed to insert hours for ${patch.name}: ${error.message}`);
        } else {
            successCount++;
        }
    }
  }

  console.log(`\nApply complete. Patches applied successfully: ${successCount}, Failed: ${failedCount}`);
  if (unresolved.length > 0) {
    console.log('Some rows still need manual operating-hour updates (see unresolved preview above).');
  }
};

run().catch((err) => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});
