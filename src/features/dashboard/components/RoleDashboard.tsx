import { trpc } from "@/lib/trpc";
import { StatsGrid } from "./StatsGrid";
import { QuickActions } from "./QuickActions";
import { RecentRequests } from "./RecentRequests";
import { ProfileSummary } from "./ProfileSummary";
import { PendingApprovalsWidget } from "./PendingApprovalsWidget";
import { NoticeBoard } from "@/components/NoticeBoard";
import { SuggestionBoxForm } from "@/components/SuggestionBoxForm";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DollarSign, Shield, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { HRDashboard } from "./HRDashboard";
import { FinanceDashboard } from "./FinanceDashboard";

interface RoleDashboardProps {
  user: any;
}

export const RoleDashboard = ({ user }: RoleDashboardProps) => {
  const role = user?.role;
  const isManager = ["admin", "head_of_department", "hr", "head_of_finance", "ceo_md"].includes(role) || !!user?.additionalRoles;

  const { data: stats, isLoading: statsLoading } = trpc.requests.getDashboardStats.useQuery(undefined, {
    staleTime: 10000,
    refetchInterval: 10000,
  });

  const { data: expenditures, isLoading: expendLoading } = trpc.requests.getApprovedExpenditures.useQuery(undefined, {
    enabled: role === "head_of_finance",
    staleTime: 30000,
  });

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)]">
        {/* Main Content Area */}
        <div className="lg:col-span-8 p-4 lg:p-6 space-y-4">
          {role === "hr" ? (
            <HRDashboard />
          ) : role === "head_of_finance" ? (
            <FinanceDashboard />
          ) : (
            <>
              <StatsGrid stats={stats} loading={statsLoading} role={role} />

              {/* Role-Specific Content */}
              {isManager && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                  <PendingApprovalsWidget />
                </div>
              )}

              <div className="space-y-3">
                <NoticeBoard />
              </div>

              <RecentRequests />
            </>
          )}
        </div>

        {/* Side Panel Area - Distinct Strip */}
        <div className="lg:col-span-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-l border-[#3b6dae]/5 p-2 lg:px-6 lg:py-4 space-y-4 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.5)]">
          <div className="animate-in fade-in slide-in-from-right duration-700">
            <ProfileSummary />
          </div>

          <div className="space-y-3">
            <h2 className="text-[9px] font-black text-[#3b6dae]/30 uppercase tracking-[0.4em] px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c79d2d]" />
              Quick Commands
            </h2>
            <QuickActions />
          </div>

          <div className="space-y-3 pt-2 border-t border-[#3b6dae]/5">
            <h2 className="text-[9px] font-black text-[#3b6dae]/30 uppercase tracking-[0.4em] px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b6dae]/20" />
              Pulse & Feedback
            </h2>
            <SuggestionBoxForm />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
