import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function LeaveBalance() {
  const { isAuthenticated } = useAuth();
  const { data: leaveBalance, isLoading } = trpc.requests.getLeaveBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!leaveBalance) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
            <h1 className="text-2xl font-semibold">No Leave Balance Found</h1>
            <p className="text-gray-600">Please contact HR for assistance</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const eligible = leaveBalance.isEligibleForAnnualLeave;
  const monthsToEligibility = eligible ? 0 : Math.max(0, 12 - (leaveBalance.monthsEmployed || 0));

  // Data for charts
  const leaveBreakdown = [
    { name: "Taken", value: leaveBalance.annualLeaveTaken || 0, fill: "#ef4444" },
    { name: "Remaining", value: Math.max(0, (leaveBalance.annualLeaveRemaining || 0)), fill: "#22c55e" },
  ];

  const monthlyAccrual = [
    { month: "Jan", days: 1.5 },
    { month: "Feb", days: 1.5 },
    { month: "Mar", days: 1.5 },
    { month: "Apr", days: 1.5 },
    { month: "May", days: 1.5 },
    { month: "Jun", days: 1.5 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8 p-4 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#3b6dae] dark:text-[#c79d2d]">
            Leave Balance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your annual leave entitlement and usage overview
          </p>
        </div>

        {/* Eligibility Status */}
        {!eligible && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border-l-4 border-orange-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-200">
                  Annual Leave Not Yet Available
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                  You will be eligible after {monthsToEligibility} more month(s) of employment.
                  Currently, you have accrued <span className="font-semibold">{(leaveBalance as any).totalAnnualLeave?.toFixed(1) || '0'} days</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Entitled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {(leaveBalance as any).totalAnnualLeave?.toFixed(1) || '0'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {leaveBalance.isEligibleForAnnualLeave ? "18 base + accrual" : "Based on employment period"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Already Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {leaveBalance.annualLeaveTaken || '0'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                days used
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Math.max(0, leaveBalance.annualLeaveRemaining || 0).toFixed(1)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                available to use
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Employment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {(leaveBalance as any).yearsEmployed}y {(leaveBalance.monthsEmployed || 0) % 12}m
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                with company
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leave Usage */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Leave Usage</CardTitle>
              <CardDescription>Current year breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leaveBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leaveBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => Number(value).toFixed(1)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Accrual */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Accrual</CardTitle>
              <CardDescription>1.5 days per month (after first year)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyAccrual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }}
                    formatter={(value) => `${Number(value).toFixed(1)} days`}
                  />
                  <Bar dataKey="days" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Leave Policy Info */}
        <Card className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Leave Policy Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  First Year
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  You accrue <strong>1.5 days per month</strong> during your first year. This amounts to 18 days total by the end of your first year.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  After First Year
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  After completing one year, you are entitled to <strong>18 days base</strong> plus an additional <strong>1.5 days per month</strong> for ongoing service.
                </p>
              </div>
            </div>
            <div className="border-t border-blue-200 dark:border-blue-700 pt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Important Notes
              </h4>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Leave must be requested at least 5 business days in advance</li>
                <li>• Unused leave from current year does not carry over automatically</li>
                <li>• Leave requests require approval from your Head of Department</li>
                <li>• Contact HR for special leave types (bereavement, emergency, etc.)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
