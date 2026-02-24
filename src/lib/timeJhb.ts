const JHB_TIMEZONE = 'Africa/Johannesburg';

const JHB_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: JHB_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const parseTimeToMinutes = (timeText?: string | null): number | null => {
  if (!timeText) return null;
  const clean = String(timeText).trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
};

export const getJhbNowMinutes = (now: Date = new Date()): number => {
  const parts = JHB_FORMATTER.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
};

export const isOpenNowJhb = (
  openingTime?: string | null,
  closingTime?: string | null,
  now: Date = new Date()
): boolean => {
  const open = parseTimeToMinutes(openingTime);
  const close = parseTimeToMinutes(closingTime);
  if (open === null || close === null) return false;

  const current = getJhbNowMinutes(now);

  // Equal times interpreted as always-open day cycle.
  if (open === close) return true;

  // Same-day range: 08:00 -> 17:00
  if (close > open) {
    return current >= open && current < close;
  }

  // Overnight range: 18:00 -> 02:00
  return current >= open || current < close;
};

export const JHB_TIMEZONE_NAME = JHB_TIMEZONE;
