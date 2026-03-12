/**
 * Leave Calculator Utility
 * Handles working days calculation, excluding weekends and international holidays
 * Only RWANDAN public holidays are excluded from leave calculations
 */

export type HolidayType = "rwandan" | "european" | "american";
type HolidayMap = Record<string, string>;

// Rwandan holidays for 2025-2026
const RWANDA_HOLIDAYS_2025_2026: HolidayMap = {
  "2025-01-01": "New Year's Day",
  "2025-02-01": "National Heroes Day",
  "2025-04-07": "Genocide against the Tutsi Memorial Day",
  "2025-04-18": "Good Friday",
  "2025-05-01": "Labour Day",
  "2025-07-01": "Independence Day",
  "2025-07-04": "Liberation Day",
  "2025-08-01": "Umuganura Day",
  "2025-08-15": "Assumption of Mary",
  "2025-12-25": "Christmas Day",
  "2025-12-26": "Boxing Day",
  "2026-01-01": "New Year's Day",
  "2026-02-01": "National Heroes Day",
  "2026-04-03": "Good Friday",
  "2026-04-07": "Genocide against the Tutsi Memorial Day",
  "2026-05-01": "Labour Day",
  "2026-07-01": "Independence Day",
  "2026-07-04": "Liberation Day",
  "2026-08-07": "Umuganura Day",
  "2026-08-15": "Assumption of Mary",
  "2026-12-25": "Christmas Day",
  "2026-12-26": "Boxing Day",
};

// European holidays for calendar display
const EUROPEAN_HOLIDAYS_2025_2026: HolidayMap = {
  "2025-01-01": "New Year's Day",
  "2025-04-20": "Easter Sunday",
  "2025-04-21": "Easter Monday",
  "2025-05-01": "Labour Day",
  "2025-05-29": "Ascension Day",
  "2025-06-09": "Whit Monday",
  "2025-08-15": "Assumption of Mary",
  "2025-11-01": "All Saints' Day",
  "2025-12-25": "Christmas Day",
  "2025-12-26": "Boxing Day",
  "2026-01-01": "New Year's Day",
  "2026-04-05": "Easter Sunday",
  "2026-04-06": "Easter Monday",
  "2026-05-01": "Labour Day",
  "2026-05-14": "Ascension Day",
  "2026-05-25": "Whit Monday",
  "2026-08-15": "Assumption of Mary",
  "2026-11-01": "All Saints' Day",
  "2026-12-25": "Christmas Day",
  "2026-12-26": "Boxing Day",
};

// American holidays for calendar display
const AMERICAN_HOLIDAYS_2025_2026: HolidayMap = {
  "2025-01-01": "New Year's Day",
  "2025-01-20": "MLK Jr. Day",
  "2025-02-17": "Presidents' Day",
  "2025-05-26": "Memorial Day",
  "2025-07-04": "Independence Day",
  "2025-09-01": "Labor Day",
  "2025-10-13": "Columbus Day",
  "2025-11-11": "Veterans Day",
  "2025-11-27": "Thanksgiving",
  "2025-12-25": "Christmas",
  "2026-01-01": "New Year's Day",
  "2026-01-19": "MLK Jr. Day",
  "2026-02-16": "Presidents' Day",
  "2026-05-25": "Memorial Day",
  "2026-07-03": "Independence Day (observed)",
  "2026-09-07": "Labor Day",
  "2026-10-12": "Columbus Day",
  "2026-11-11": "Veterans Day",
  "2026-11-26": "Thanksgiving",
  "2026-12-25": "Christmas",
};

/**
 * Converts a Date object to a 'YYYY-MM-DD' string in UTC timezone.
 * Using UTC methods avoids issues where the user's local timezone could shift the date.
 */
const toYYYYMMDD = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
};

/**
 * Generic function to check if a date is in a given holiday map.
 */
const isHoliday = (date: Date | string, holidayMap: HolidayMap): boolean => {
  const dateStr = typeof date === 'string' ? date : toYYYYMMDD(date);
  return holidayMap.hasOwnProperty(dateStr);
};

/**
 * Check if a date is a Rwandan national holiday.
 */
export const isRwandanHoliday = (date: Date | string): boolean => {
  return isHoliday(date, RWANDA_HOLIDAYS_2025_2026);
};

/**
 * Check if a date is a European holiday (for display only).
 */
export const isEuropeanHoliday = (date: Date | string): boolean => {
  return isHoliday(date, EUROPEAN_HOLIDAYS_2025_2026);
};

/**
 * Check if a date is an American holiday (for display only).
 */
export const isAmericanHoliday = (date: Date | string): boolean => {
  return isHoliday(date, AMERICAN_HOLIDAYS_2025_2026);
};

/**
 * Check if a date is any international holiday (for display).
 */
export const isInternationalHoliday = (date: Date | string): boolean => {
  return isRwandanHoliday(date) || isEuropeanHoliday(date) || isAmericanHoliday(date);
};

/**
 * Get holiday type for a specific date
 */
export const getHolidayType = (date: Date | string): HolidayType | null => {
  if (isRwandanHoliday(date)) return "rwandan";
  if (isEuropeanHoliday(date)) return "european";
  if (isAmericanHoliday(date)) return "american";
  return null;
};

/**
 * Check if a date is a non-working day (only Rwandan holidays count for leave)
 */
export const isNonWorkingDay = (date: Date): boolean => {
  return isWeekend(date) || isRwandanHoliday(date);
};

/**
 * Calculate working days between two dates (inclusive)
 * Excludes weekends and ONLY Rwandan national holidays
 */
export const calculateWorkingDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (start > end) return 0;

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    if (!isNonWorkingDay(current)) {
      workingDays++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return workingDays;
};

/**
 * Get all non-working days in a date range
 */
export const getNonWorkingDaysInRange = (
  startDate: string,
  endDate: string
): { weekends: Date[]; rwandanHolidays: Date[]; otherHolidays: Date[] } => {
  const result: { weekends: Date[]; rwandanHolidays: Date[]; otherHolidays: Date[] } = { weekends: [], rwandanHolidays: [], otherHolidays: [] };

  if (!startDate || !endDate) return result;

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (start > end) return result;

  const current = new Date(start);

  while (current <= end) {
    const currentDate = new Date(current);
    if (isWeekend(currentDate)) {
      result.weekends.push(currentDate);
    } else if (isRwandanHoliday(currentDate)) {
      result.rwandanHolidays.push(currentDate);
    } else if (isEuropeanHoliday(currentDate) || isAmericanHoliday(currentDate)) {
      result.otherHolidays.push(currentDate);
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
};

/**
 * Calculate leave balance
 */
export const calculateLeaveBalance = (
  entitled: number,
  taken: number,
  requestedDays: number
): { remaining: number; isValid: boolean; message: string } => {
  if (requestedDays <= 0) {
    return {
      remaining: entitled - taken,
      isValid: false,
      message: "Please request at least one working day.",
    };
  }

  const available = entitled - taken;

  if (requestedDays > available) {
    return {
      remaining: available,
      isValid: false,
      message: `Insufficient balance. You only have ${available} day(s) available, but you requested ${requestedDays}.`,
    };
  }

  const remaining = available - requestedDays;

  return {
    remaining,
    isValid: true,
    message: `You will have ${remaining} day(s) remaining after this request.`,
  };
};
