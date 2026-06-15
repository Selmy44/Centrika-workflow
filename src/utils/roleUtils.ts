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

export function formatRoleList(role: string | null | undefined, additionalRoles?: string | string[] | null): string {
  const roles: string[] = [];
  if (role) {
    roles.push(role);
  }
  if (additionalRoles) {
    if (typeof additionalRoles === 'string') {
      try {
        const trimmed = additionalRoles.trim();
        if (trimmed.startsWith('[')) {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            roles.push(...parsed);
          } else {
            roles.push(parsed);
          }
        } else {
          roles.push(...trimmed.split(',').map((r: string) => r.trim()).filter(Boolean));
        }
      } catch (e) {
        roles.push(additionalRoles);
      }
    } else if (Array.isArray(additionalRoles)) {
      roles.push(...additionalRoles);
    }
  }

  const uniqueRoles = Array.from(new Set(roles.filter(Boolean)));
  return uniqueRoles.map(r => formatRole(r)).join(' & ');
}
