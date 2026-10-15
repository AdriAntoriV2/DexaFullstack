import { describe, expect, it } from 'vitest';

import {
  getJakartaTimingStatus,
} from './attendance-date.util.js';

describe('getJakartaTimingStatus', () => {
  it('marks check-in before 08:00 as EARLY', () => {
    // 07:59 WIB = 00:59 UTC
    expect(
      getJakartaTimingStatus(
        new Date('2026-10-14T00:59:00.000Z'),
        8,
      ),
    ).toBe('EARLY');
  });

  it('marks check-in at 08:00 as ON_TIME', () => {
    // 08:00 WIB = 01:00 UTC
    expect(
      getJakartaTimingStatus(
        new Date('2026-10-14T01:00:00.000Z'),
        8,
      ),
    ).toBe('ON_TIME');
  });

  it('marks check-in after 08:00 as LATE', () => {
    expect(
      getJakartaTimingStatus(
        new Date('2026-10-14T01:01:00.000Z'),
        8,
      ),
    ).toBe('LATE');
  });

  it('marks check-out before 17:00 as EARLY', () => {
    // 16:59 WIB = 09:59 UTC
    expect(
      getJakartaTimingStatus(
        new Date('2026-10-14T09:59:00.000Z'),
        17,
      ),
    ).toBe('EARLY');
  });

  it('marks check-out at 17:00 as ON_TIME', () => {
    // 17:00 WIB = 10:00 UTC
    expect(
      getJakartaTimingStatus(
        new Date('2026-10-14T10:00:00.000Z'),
        17,
      ),
    ).toBe('ON_TIME');
  });

  it('marks check-out after 17:00 as LATE', () => {
    expect(
      getJakartaTimingStatus(
        new Date('2026-10-14T10:01:00.000Z'),
        17,
      ),
    ).toBe('LATE');
  });
});