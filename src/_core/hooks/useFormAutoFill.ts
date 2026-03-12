import { useAuth } from "./useAuth";
import { useMemo } from "react";

/**
 * Hook to auto-populate form fields from authenticated user data
 * Returns user's department, position, staffId, dateOfEmployment, and managerId
 * These fields are automatically filled when creating forms for leave requests, car requests, etc.
 */
export function useFormAutoFill() {
  const { user } = useAuth();

  const autoFillData = useMemo(
    () => ({
      department: user?.department?.name || "",
      position: user?.position || "",
      staffId: user?.staffId || "",
      dateOfEmployment: user?.dateOfEmployment || "",
      managerId: user?.managerId || null,
      managerName: (user as any)?.managerName || "", // Will be populated from user profile
      employeeName: user?.name || "",
      employeeEmail: user?.email || "",
    }),
    [user]
  );

  return autoFillData;
}
