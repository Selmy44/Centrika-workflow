/**
 * Frontend hook to fetch and display user's annual leave balance
 * Utilizes the new employment-date-based calculation logic
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function useLeaveBalance() {
  const { isAuthenticated } = useAuth();
  
  const {
    data: leaveBalance,
    isLoading,
    error,
    refetch,
  } = trpc.requests.getMyLeaveBalance.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    leaveBalance,
    isLoading,
    error,
    refetch,
    totalEntitled: leaveBalance?.totalAnnualLeave ?? 0,
    usedDays: leaveBalance?.usedDays ?? 0,
    remainingDays: leaveBalance?.remainingDays ?? 0,
    monthsEmployed: leaveBalance?.monthsEmployed ?? 0,
    completedFullYear: leaveBalance?.completedFullYear ?? false,
    description: leaveBalance?.description ?? "",
  };
}
