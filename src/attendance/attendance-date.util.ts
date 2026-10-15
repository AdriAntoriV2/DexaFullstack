const BUSINESS_TIMEZONE = 'Asia/Jakarta';

export type AttendanceTimingStatus =
  | 'EARLY'
  | 'ON_TIME'
  | 'LATE';

/**
 * Returns the current calendar date in Jakarta (WIB),
 * independently of the server's local timezone.
 */
export function getJakartaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

/**
 * Maps a YYYY-MM-DD calendar date to a JavaScript Date
 * for Prisma's PostgreSQL DATE field.
 */
export function toPrismaDate(dateString: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error('Expected date in YYYY-MM-DD format.');
  }

  const date = new Date(`${dateString}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateString
  ) {
    throw new Error('Invalid calendar date.');
  }

  return date;
}

/**
 * Compares an actual timestamp with a target time in Jakarta.
 * The target is minute-based: 08:00 and 17:00 are on time
 * throughout their respective minutes.
 */
export function getJakartaTimingStatus(
  timestamp: Date,
  targetHour: number,
): AttendanceTimingStatus {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(timestamp);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  const hour = Number(values.hour);
  const minute = Number(values.minute);

  const actualMinutes = hour * 60 + minute;
  const targetMinutes = targetHour * 60;

  if (actualMinutes < targetMinutes) {
    return 'EARLY';
  }

  if (actualMinutes > targetMinutes) {
    return 'LATE';
  }

  return 'ON_TIME';
}