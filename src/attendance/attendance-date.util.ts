
const BUSINESS_TIMEZONE = 'Asia/Jakarta';

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
 *
 * UTC midnight here is a representation of the date,
 * not the actual check-in timestamp.
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
