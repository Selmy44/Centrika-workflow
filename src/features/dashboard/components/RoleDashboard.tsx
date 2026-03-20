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
import DashboardLayout from "@/components/DashboardLayout";

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
          <StatsGrid stats={stats} loading={statsLoading} role={role} />

          {/* Role-Specific Content */}
          {isManager && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
              <PendingApprovalsWidget />
            </div>
          )}

          {role === "head_of_finance" && (
            <Card className="bg-white/50 backdrop-blur-sm border-border/50 rounded-2xl overflow-hidden">
              <CardHeader className="bg-[#3b6dae]/5 border-b border-border/30 py-3">
                <CardTitle className="flex items-center gap-2 text-[#3b6dae] text-base">
                  <DollarSign size={18} />
                  Financial Overview
                </CardTitle>
                <CardDescription className="text-[10px]">Consolidated approved expenditure tracking</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: "RWF Approved", value: expenditures?.rwf, color: "#3b6dae" },
                    { label: "USD Approved", value: expenditures?.usd, color: "#8C89B4" },
                    { label: "EUR Approved", value: expenditures?.eur, color: "#c79d2d" }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-white border border-border/50 rounded-xl shadow-sm">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{item.label}</p>
                      <p className="text-lg font-black" style={{ color: item.color }}>
                        {expendLoading ? "..." : `${item.value?.toLocaleString() || 0} ${item.label.split(' ')[0]}`}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <NoticeBoard />
          </div>

          <RecentRequests />
        </div>

        {/* Side Panel Area - Distinct Strip */}
        <div className="lg:col-span-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-l border-[#3b6dae]/5 p-2 lg:p-6 lg:pt-4 space-y-8 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.5)]">
          <div className="animate-in fade-in slide-in-from-right duration-700">
            <ProfileSummary />
          </div>

          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-[#3b6dae]/30 uppercase tracking-[0.4em] px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c79d2d]" />
              Quick Commands
            </h2>
            <QuickActions />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#3b6dae]/5">
            <h2 className="text-[10px] font-black text-[#3b6dae]/30 uppercase tracking-[0.4em] px-1 flex items-center gap-2">
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
