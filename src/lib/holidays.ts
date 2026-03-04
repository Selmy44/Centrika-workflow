/**
 * Rwanda National Holidays and International Holidays
 * Includes Rwanda, Islamic, Christian (Catholic & Protestant), American, and European holidays
 * https://en.wikipedia.org/wiki/Public_holidays_in_Rwanda
 */

export const RWANDA_HOLIDAYS_2026 = [
  // Rwanda National Holidays
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-01-28", name: "Democracy Day" },
  { date: "2026-02-01", name: "Martyrs' Day" },
  { date: "2026-04-07", name: "Genocide Remembrance Day" },
  { date: "2026-05-01", name: "Labour Day" },
  { date: "2026-05-14", name: "Ascension Day (Christian)" },
  { date: "2026-05-25", name: "Africa Day" },
  { date: "2026-07-01", name: "Independence Day" },
  { date: "2026-08-15", name: "Assumption of Mary (Catholic)" },
  { date: "2026-11-01", name: "All Saints' Day (Catholic)" },
  { date: "2026-12-25", name: "Christmas Day" },
  
  // Islamic Holidays 2026 (Hijri dates vary by moon sighting)
  { date: "2026-01-30", name: "Eid al-Fitr (Islamic)" },
  { date: "2026-02-08", name: "Eid al-Adha (Islamic)" },
  { date: "2026-02-27", name: "Islamic New Year" },
  { date: "2026-05-07", name: "Mawlid al-Nabi (Prophet's Birthday)" },
  
  // Christian Holidays (Catholic & Protestant)
  { date: "2026-01-06", name: "Epiphany (Christian)" },
  { date: "2026-02-13", name: "Good Friday (varies, moved to vary)" },
  { date: "2026-02-16", name: "Easter Monday (Christian)" },
  { date: "2026-12-26", name: "Boxing Day" },
  
  // American Holidays (for international employees)
  { date: "2026-01-19", name: "MLK Jr. Day (USA)" },
  { date: "2026-02-16", name: "Presidents' Day (USA)" },
  { date: "2026-05-25", name: "Memorial Day (USA)" },
  { date: "2026-07-04", name: "Independence Day (USA)" },
  { date: "2026-09-07", name: "Labor Day (USA)" },
  { date: "2026-11-26", name: "Thanksgiving (USA)" },
  
  // European Holidays
  { date: "2026-01-01", name: "New Year's Day (Europe)" },
  { date: "2026-05-01", name: "Labour Day (Europe)" },
  { date: "2026-05-14", name: "Ascension Day (Europe)" },
  { date: "2026-05-24", name: "Whit Sunday (Europe)" },
  { date: "2026-05-25", name: "Whit Monday (Europe)" },
  { date: "2026-08-15", name: "Assumption of Mary (Europe)" },
  { date: "2026-11-01", name: "All Saints' Day (Europe)" },
  { date: "2026-12-25", name: "Christmas Day (Europe)" },
  { date: "2026-12-26", name: "Boxing Day (Europe)" },
];

/**
 * Get all holidays for a given year
 */
export function getHolidaysForYear(year: number) {
  return RWANDA_HOLIDAYS_2026.filter(h => h.date.startsWith(year.toString()));
}

/**
 * Check if a date is a national holiday
 */
export function isNationalHoliday(dateStr: string): boolean {
  return RWANDA_HOLIDAYS_2026.some(h => h.date === dateStr);
}

/**
 * Get holiday name if date is a holiday
 */
export function getHolidayName(dateStr: string): string | null {
  const holiday = RWANDA_HOLIDAYS_2026.find(h => h.date === dateStr);
  return holiday?.name || null;
}

/**
 * Check if a date is a weekend (Saturday = 6, Sunday = 0)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Check if a date is a weekend by string (YYYY-MM-DD)
 */
export function isWeekendString(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00Z");
  return isWeekend(date);
}

/**
 * Calculate working days between two dates (excluding weekends and holidays)
 * Counts from startDate (inclusive) to endDate (exclusive)
 * This is the core logic for annual leave calculation
 */
export function calculateWorkingDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  if (start >= end) return 0;

  let workingDays = 0;
  const currentDate = new Date(start);

  // Count from start date (inclusive) up to but not including end date
  while (currentDate < end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    
    // Count only if it's not a weekend and not a holiday
    if (!isWeekend(currentDate) && !isNationalHoliday(dateStr)) {
      workingDays++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

/**
 * Get all dates in a range that are weekends or holidays
 * Useful for marking them in the calendar UI
 */
export function getExcludedDates(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];

  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  const excluded: string[] = [];

  const currentDate = new Date(start);

  // Count from start (inclusive) to end (exclusive)
  while (currentDate < end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    
    if (isWeekend(currentDate) || isNationalHoliday(dateStr)) {
      excluded.push(dateStr);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return excluded;
}

/**
 * Check if a date is excluded (weekend or holiday)
 */
export function isExcludedDate(dateStr: string): boolean {
  return isWeekend(new Date(dateStr + "T00:00:00Z")) || isNationalHoliday(dateStr);
}
