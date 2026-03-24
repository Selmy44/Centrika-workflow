import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { differenceInBusinessDays, parseISO, isValid } from "date-fns";
import { Calculator, Calendar, Clock, AlertCircle, CheckCircle2, History } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface LeaveBalanceCalculatorProps {
  leaveType: "annual" | "sick" | "paternity" | "maternity" | "unpaid" | "personal" | "parental" | string;
  startDate: string;
  endDate: string;
  alreadyTaken?: number; // Optional now, since we auto-calculate by default
  onTakenChange?: (val: number) => void;
  onCalculated: (data: { requested: number; remaining: number | "Unlimited"; entitled: number | "Unlimited"; taken: number }) => void;
}

export function LeaveBalanceCalculator({
  leaveType,
  startDate,
  endDate,
  onCalculated,
}: LeaveBalanceCalculatorProps) {
  const { user } = useAuth();
  
  // Fetch user's accurate leave balance from the backend (for Annual Leave primarily)
  const leaveBalanceQuery = trpc.requests.getLeaveBalance.useQuery(undefined, {
    staleTime: 60000,
  });

  const [requestedDays, setRequestedDays] = useState(0);
  const [entitledDays, setEntitledDays] = useState<number | "Unlimited">(0);

  // 1. Calculate DB-backed 'Already Taken' dynamically
  const historyTaken = useMemo(() => {
    const type = leaveType.toLowerCase();
    
    if (type === "annual") {
      return leaveBalanceQuery.data?.annualLeaveTaken || 0;
    }
    
    // For Sick, Parental (Maternity/Paternity), Personal, and Unpaid leaves,
    // they operate on a PER-REQUEST limit rather than an annual pool.
    // They get exact new days every request limit (e.g. 5 for sick, 84 for maternity)
    return 0;
  }, [leaveBalanceQuery.data, leaveType]);

  // 2. Calculate Entitled Days
  useEffect(() => {
    let entitled: number | "Unlimited" = 0;
    const type = leaveType.toLowerCase();

    if (type === "annual") {
      // Use exactly what the backend statutory rule calculated (1.5 days/month, min 1 yr etc)
      entitled = leaveBalanceQuery.data?.annualLeaveEntitled || 0;
    } else if (type === "sick") {
      entitled = 5;
    } else if (type === "maternity" || (type === "parental" && (user as any)?.gender === "female")) {
      entitled = 84;
    } else if (type === "paternity" || (type === "parental" && (user as any)?.gender === "male")) {
      entitled = 7;
    } else if (type === "unpaid") {
      entitled = "Unlimited";
    } else if (type === "personal") {
      entitled = 3;
    }

    setEntitledDays(entitled);
  }, [leaveType, (user as any)?.gender, leaveBalanceQuery.data]);

  // 3. Calculate Requested Days (Business Days Only)
  useEffect(() => {
    if (!startDate || !endDate) {
      setRequestedDays(0);
      return;
    }
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (isValid(start) && isValid(end)) {
      if (end < start) {
        setRequestedDays(0);
        return;
      }
      const days = differenceInBusinessDays(end, start) + 1;
      setRequestedDays(days > 0 ? days : 0);
    } else {
      setRequestedDays(0);
    }
  }, [startDate, endDate]);

  // 4. Fire to Parent
  useEffect(() => {
    let remaining: number | "Unlimited" = "Unlimited";
    if (entitledDays !== "Unlimited") {
      remaining = entitledDays - historyTaken - requestedDays;
    }

    onCalculated({
      requested: requestedDays,
      remaining,
      entitled: entitledDays,
      taken: historyTaken,
    });
  }, [requestedDays, entitledDays, historyTaken, onCalculated]);

  const currentBalance = entitledDays === "Unlimited" ? "Unlimited" : (Number(entitledDays) - historyTaken);
  const newBalance = entitledDays === "Unlimited" ? "Unlimited" : (Number(currentBalance) - requestedDays);
  const isNegative = typeof newBalance === "number" && newBalance < 0;

  return (
    <div className="mt-6 mb-4 flex flex-col gap-6">
      
      {/* ----------------- PART 1: LEAVE SUMMARY ----------------- */}
      <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-white dark:bg-[#1f426b] overflow-hidden shadow-sm">
        <div className="bg-blue-600 px-4 py-2.5 flex items-center gap-2 text-white">
          <History className="w-4 h-4 opacity-90" />
          <h3 className="text-sm font-semibold tracking-wide">Your Leave Summary</h3>
          <span className="text-[10px] bg-white dark:bg-[#1f426b] px-2 py-0.5 rounded-full ml-auto uppercase tracking-wide">
            Auto-Synced
          </span>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-[#2a4365]/50">
          <div className="bg-white dark:bg-[#1f426b] rounded-lg p-3 border shadow-sm text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Entitlement</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{entitledDays}</p>
          </div>
          <div className="bg-white dark:bg-[#1f426b] rounded-lg p-3 border shadow-sm text-center">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Already Taken</p>
            {leaveBalanceQuery.isPending ? (
               <p className="text-sm text-slate-400 mt-2 animate-pulse">Loading...</p>
            ) : (
               <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{historyTaken}</p>
            )}
          </div>
          <div className="bg-white dark:bg-[#1f426b] rounded-lg p-3 border shadow-sm text-center">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500">{currentBalance}</p>
          </div>
        </div>
      </div>

      {/* ----------------- PART 2: LEAVE CALCULATOR ----------------- */}
      <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-800/50 overflow-hidden shadow-sm">
        <div className="bg-[#3b6dae] px-4 py-2.5 flex items-center gap-2 text-white">
          <Calculator className="w-4 h-4 opacity-90" />
          <h3 className="text-sm font-semibold tracking-wide">Leave Duration Calculator</h3>
          <span className="text-[10px] text-blue-100 ml-auto flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Calendar Linked
          </span>
        </div>
        
        <div className="p-4 md:p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card: Requested */}
            <div className="bg-white dark:bg-[#1f426b] rounded-lg p-3 md:p-4 border border-border shadow-sm flex items-center gap-4">
              <div className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 p-2.5 rounded-full shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Requested Days</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {requestedDays}
                </p>
              </div>
            </div>

            {/* Card: New Balance */}
            <div className={`rounded-lg p-3 md:p-4 border shadow-sm flex items-center gap-4 transition-colors ${
              isNegative 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              <div className={`p-2.5 rounded-full shrink-0 ${
                isNegative 
                  ? 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300' 
                  : 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300'
              }`}>
                {isNegative ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New Balance</p>
                <p className={`text-2xl md:text-3xl font-bold ${
                  isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {newBalance}
                </p>
              </div>
            </div>

          </div>

          {/* Progress Bar Display */}
          {typeof entitledDays === "number" && (
            <div className="mt-2 px-1">
              <div className="flex justify-between text-[10px] mb-1 font-medium text-muted-foreground">
                <span>0% Utilized</span>
                <span>{entitledDays} Days Entitlement</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-[#2c5282] rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (historyTaken / entitledDays) * 100)}%` }}
                  title={`Taken: ${historyTaken}`}
                />
                <div 
                  className={`h-full transition-all duration-500 ${isNegative ? 'bg-red-500' : 'bg-purple-500'}`}
                  style={{ width: `${Math.min(100, (requestedDays / entitledDays) * 100)}%` }}
                  title={`Requested: ${requestedDays}`}
                />
              </div>
              <div className="flex gap-4 mt-2 justify-end">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Taken
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  <span className={`w-2 h-2 rounded-full ${isNegative ? 'bg-red-500' : 'bg-purple-500'}`}></span> Requested
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
