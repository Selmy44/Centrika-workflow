/**
 * Leave Balance Calculator
 * 
 * New Logic:
 * - During first year: Employee accumulates 1.5 days per month based on employment date
 * - After 1 year: Employee gets 18 days base + continues accumulating 1.5 days per additional month
 * 
 * Formula:
 * - Monthly accrual = 1.5 days per month
 * - If employed >= 1 year: totalDays = 18 + (additional_months * 1.5)
 * - If employed < 1 year: totalDays = (complete_months * 1.5)
 */

interface LeaveBalanceResult {
  totalAnnualLeave: number;
  monthsEmployed: number;
  yearsEmployed: number;
  completedFullYear: boolean;
  baseEntitlement: number;
  accruedSinceFirstYear: number;
  description: string;
}

/**
 * Calculate annual leave balance based on employment date
 * @param dateOfEmployment - Employee's date of employment (YYYY-MM-DD format)
 * @param today - Current date (defaults to today)
 * @returns LeaveBalanceResult with detailed breakdown
 */
export function calculateAnnualLeaveBalance(
  dateOfEmployment: string | null | undefined,
  today: Date = new Date()
): LeaveBalanceResult {
  // Default case: no employment date provided
  if (!dateOfEmployment || dateOfEmployment.trim() === "") {
    return {
      totalAnnualLeave: 0,
      monthsEmployed: 0,
      yearsEmployed: 0,
      completedFullYear: false,
      baseEntitlement: 0,
      accruedSinceFirstYear: 0,
      description: "No employment date recorded",
    };
  }

  try {
    // Parse the employment date (expecting YYYY-MM-DD format)
    const empDate = new Date(dateOfEmployment);
    
    // Validate the date
    if (isNaN(empDate.getTime())) {
      return {
        totalAnnualLeave: 0,
        monthsEmployed: 0,
        yearsEmployed: 0,
        completedFullYear: false,
        baseEntitlement: 0,
        accruedSinceFirstYear: 0,
        description: "Invalid employment date format",
      };
    }

    // If employment date is in the future, return 0
    if (empDate > today) {
      return {
        totalAnnualLeave: 0,
        monthsEmployed: 0,
        yearsEmployed: 0,
        completedFullYear: false,
        baseEntitlement: 0,
        accruedSinceFirstYear: 0,
        description: "Employment date is in the future",
      };
    }

    // Calculate months and years employed
    let months = (today.getFullYear() - empDate.getFullYear()) * 12 + 
                 (today.getMonth() - empDate.getMonth());
    
    // Adjust if today's day of the month is less than employment start day of the month
    if (today.getDate() < empDate.getDate()) {
      months--;
    }
    
    // Only count complete months (not including partial months)
    const completeMonths = Math.max(0, months);
    
    // Check if employee has completed 1 full year (12 months)
    const completedFullYear = completeMonths >= 12;
    
    // Calculate years and remaining months
    const yearsEmployed = Math.floor(completeMonths / 12);
    const monthsInCurrentYear = completeMonths % 12;
    
    let totalAnnualLeave = 0;
    let baseEntitlement = 0;
    let accruedSinceFirstYear = 0;

    if (completedFullYear) {
      // Employee has completed 1+ year
      // Base entitlement: 18 days
      // Additional accrual: 1.5 days per month for months beyond 12
      baseEntitlement = 18;
      accruedSinceFirstYear = (completeMonths - 12) * 1.5;
      totalAnnualLeave = baseEntitlement + accruedSinceFirstYear;
    } else {
      // Employee is in first year
      // Accrual: 1.5 days per complete month
      baseEntitlement = 0;
      accruedSinceFirstYear = completeMonths * 1.5;
      totalAnnualLeave = accruedSinceFirstYear;
    }

    return {
      totalAnnualLeave: parseFloat(totalAnnualLeave.toFixed(2)),
      monthsEmployed: completeMonths,
      yearsEmployed,
      completedFullYear,
      baseEntitlement,
      accruedSinceFirstYear: parseFloat(accruedSinceFirstYear.toFixed(2)),
      description: completedFullYear
        ? `${yearsEmployed} year(s) ${monthsInCurrentYear} month(s) employed. Base: 18 days + ${parseFloat((accruedSinceFirstYear).toFixed(2))} additional days`
        : `${completeMonths} month(s) employed. Accrued: ${parseFloat(accruedSinceFirstYear.toFixed(2))} days`,
    };
  } catch (error) {
    console.error("[calculateAnnualLeaveBalance] Error:", error);
    return {
      totalAnnualLeave: 0,
      monthsEmployed: 0,
      yearsEmployed: 0,
      completedFullYear: false,
      baseEntitlement: 0,
      accruedSinceFirstYear: 0,
      description: "Error calculating leave balance",
    };
  }
}

/**
 * Get leave balance for a specific year
 * This is useful for year-based tracking
 * @param dateOfEmployment - Employee's date of employment
 * @param year - The year to calculate for
 * @returns Annual leave entitled for that specific year
 */
export function getLeaveBalanceForYear(
  dateOfEmployment: string | null | undefined,
  year: number
): number {
  if (!dateOfEmployment) return 0;

  // Create a date for the end of the requested year
  const yearEndDate = new Date(`${year}-12-31`);
  
  // If the year hasn't ended yet, use today's date
  const today = new Date();
  const dateToUse = yearEndDate > today ? today : yearEndDate;

  const result = calculateAnnualLeaveBalance(dateOfEmployment, dateToUse);
  return result.totalAnnualLeave;
}

/**
 * Calculate remaining annual leave after deducting used days
 * @param dateOfEmployment - Employee's date of employment
 * @param usedDays - Number of days already used/approved
 * @param today - Current date
 * @returns Remaining days available
 */
export function getRemainingAnnualLeave(
  dateOfEmployment: string | null | undefined,
  usedDays: number = 0,
  today: Date = new Date()
): number {
  const result = calculateAnnualLeaveBalance(dateOfEmployment, today);
  const remaining = result.totalAnnualLeave - usedDays;
  return Math.max(0, parseFloat(remaining.toFixed(2))); // Return 0 if negative
}
