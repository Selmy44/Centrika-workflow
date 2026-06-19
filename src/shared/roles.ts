/**
 * Safely parses additional roles string into an array of strings.
 * Handles:
 * - JSON-formatted array strings (e.g. '["hr", "head_of_finance"]')
 * - Comma-separated/whitespace-separated values (e.g. 'hr, head_of_finance', 'hr head_of_finance')
 * - Null, undefined, or empty strings.
 */
export function parseAdditionalRoles(roles: string | null | undefined): string[] {
  if (!roles) {
    return [];
  }

  const trimmed = roles.trim();
  if (!trimmed) {
    return [];
  }

  // 1. Try to parse as JSON first (if it looks like a JSON array/string)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((r: any) => typeof r === 'string' ? r.trim() : String(r).trim())
          .filter(Boolean);
      }
    } catch (e) {
      // Fall through to plain text parsing if JSON parsing fails
    }
  }

  // 2. Parse as comma/whitespace-separated string
  return trimmed
    .split(/[\s,]+/)
    .map(r => r.trim())
    .filter(Boolean);
}

export const ROLE_LABELS: Record<string, string> = {
  user: "Employee",
  admin: "Admin",
  hr: "HR",
  head_of_department: "Head of Department",
  head_of_finance: "Head of Finance",
  ceo_md: "CEO/MD",
};

export function formatRole(role: string | null | undefined): string {
  if (!role) return "";
  return ROLE_LABELS[role.toLowerCase()] || role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

