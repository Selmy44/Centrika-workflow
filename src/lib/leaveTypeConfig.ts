/**
 * Leave Type Form Mapping
 * Maps leave types to their specific form headers and component configurations
 */

export const leaveTypeConfig = {
  annual: {
    title: "ANNUAL LEAVE REQUEST FORM",
    description: "Request for annual leave entitlement",
    entitlementDays: 18,
    maxDaysPerRequest: 18,
    icon: "🏖️",
    color: "yellow",
    requiresSupportingDoc: false,
    requiresEmploymentDuration: true, // Must have 1+ year
    minEmploymentDays: 365,
  },
  sick: {
    title: "SICK LEAVE REQUEST FORM",
    description: "Request for sick leave due to illness or medical reasons",
    entitlementDays: 5,
    maxDaysPerRequest: 5,
    icon: "🏥",
    color: "red",
    requiresSupportingDoc: true, // MUST attach medical document
    requiresEmploymentDuration: false, // No employment requirement for sick leave
    reasonRequiredIfDaysExceed: 5, // If requesting > 5 days
  },
  paternity: {
    title: "PATERNITY LEAVE REQUEST FORM",
    description: "Request for paternity leave upon birth of a child",
    entitlementDays: 7,
    maxDaysPerRequest: 7,
    icon: "👨‍👶",
    color: "cyan",
    requiresSupportingDoc: true, // Birth certificate or proof of birth
    requiresEmploymentDuration: false, // No employment requirement for paternity leave
  },
  maternity: {
    title: "MATERNITY LEAVE REQUEST FORM",
    description: "Request for maternity leave due to pregnancy and childbirth",
    entitlementDays: 84, // 12 weeks
    maxDaysPerRequest: 84, // 12 weeks (84 days)
    icon: "👩‍👶",
    color: "pink",
    requiresSupportingDoc: true, // Medical certificate or proof of pregnancy
    requiresEmploymentDuration: false, // No employment requirement for maternity leave
  },
  unpaid: {
    title: "UNPAID LEAVE REQUEST FORM",
    description: "Request for unpaid leave",
    entitlementDays: 0,
    maxDaysPerRequest: null, // No limit
    icon: "💼",
    color: "gray",
    requiresSupportingDoc: false,
    requiresEmploymentDuration: false,
  },
  parental: {
    title: "PARENTAL LEAVE REQUEST FORM",
    description: "Request for paternity or maternity leave",
    entitlementDays: 7, // Default, will be overridden by dropdown selection
    maxDaysPerRequest: 7, // Default, will be overridden by dropdown selection
    icon: "👨‍👩‍👧",
    color: "green",
    requiresSupportingDoc: true, // Birth certificate or medical certificate
    requiresEmploymentDuration: false, // No employment requirement for parental leave
  },
};

export function getLeaveTypeConfig(leaveType: string) {
  return (
    leaveTypeConfig[leaveType as keyof typeof leaveTypeConfig] ||
    leaveTypeConfig.annual
  );
}

export type LeaveType = keyof typeof leaveTypeConfig;
