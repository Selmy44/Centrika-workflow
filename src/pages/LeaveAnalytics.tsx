import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { TrendingUp, Calendar, AlertCircle, Users } from "lucide-react";

const monthlyData = [
  { month: "Jan", taken: 12, remaining: 28, approved: 10 },
  { month: "Feb", taken: 8, remaining: 20, approved: 7 },
  { month: "Mar", taken: 15, remaining: 5, approved: 13 },
  { month: "Apr", taken: 10, remaining: 8, approved: 9 },
  { month: "May", taken: 6, remaining: 2, approved: 5 },
  { month: "Jun", taken: 9, remaining: 0, approved: 8 },
];

const leaveTypeData = [
  { type: "Annual Leave", total: 60, used: 45, percent: 75 },
  { type: "Sick Leave", total: 12, used: 8, percent: 67 },
  { type: "Casual Leave", total: 4, used: 2, percent: 50 },
  { type: "Compassionate Leave", total: 3, used: 1, percent: 33 },
];

const departmentComparison = [
  { department: "Engineering", avgDaysTaken: 12.5, avgDaysRemaining: 7.5 },
  { department: "Marketing", avgDaysTaken: 10.2, avgDaysRemaining: 9.8 },
  { department: "Finance", avgDaysTaken: 11.8, avgDaysRemaining: 8.2 },
  { department: "HR", avgDaysTaken: 8.5, avgDaysRemaining: 11.5 },
  { department: "Operations", avgDaysTaken: 13.1, avgDaysRemaining: 6.9 },
];

const leavePatterns = [
  { month: 1, requests: 4, approvals: 3, rejections: 1 },
  { month: 2, requests: 2, approvals: 2, rejections: 0 },
  { month: 3, requests: 5, approvals: 5, rejections: 0 },
  { month: 4, requests: 3, approvals: 3, rejections: 0 },
  { month: 5, requests: 6, approvals: 5, rejections: 1 },
  { month: 6, requests: 4, approvals: 4, rejections: 0 },
];

export default function LeaveAnalytics() {
  const { isAuthenticated } = useAuth();

  const totalTaken = monthlyData.reduce((sum, d) => sum + d.taken, 0);
  const totalApproved = monthlyData.reduce((sum, d) => sum + d.approved, 0);
  const totalRequests = leavePatterns.reduce((sum, d) => sum + d.requests, 0);
  const totalApprovals = leavePatterns.reduce((sum, d) => sum + d.approvals, 0);
  const approvalRate = Math.round((totalApprovals / totalRequests) * 100);

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Leave Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive leave utilization, trends, and departmental insights
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {totalTaken}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                days across company
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {totalApproved}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                approved requests
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {totalRequests}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                this year
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Approval Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {approvalRate}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                request acceptance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Leave Trend
              </CardTitle>
              <CardDescription>Days taken vs remaining per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorTaken" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px"
                    }}
                    labelStyle={{ color: "#f3f4f6" }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="taken"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorTaken)"
                    name="Days Taken"
                  />
                  <Area
                    type="monotone"
                    dataKey="remaining"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorRemaining)"
                    name="Days Remaining"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Leave Type Distribution */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Type Utilization
              </CardTitle>
              <CardDescription>Usage percentage by leave type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveTypeData.map((type, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.type}
                      </span>
                      <Badge variant="outline">
                        {type.used} / {type.total}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all w-[var(--progress)]"
                        style={{ "--progress": `${type.percent}%` } as any}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {type.percent}% utilized
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Comparison */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Department Comparison
            </CardTitle>
            <CardDescription>Average leave patterns by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="department" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "#f3f4f6" }}
                />
                <Legend />
                <Bar dataKey="avgDaysTaken" fill="#ef4444" radius={[8, 8, 0, 0]} name="Avg Days Taken" />
                <Bar dataKey="avgDaysRemaining" fill="#10b981" radius={[8, 8, 0, 0]} name="Avg Days Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Request Patterns */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Request Approval Patterns
            </CardTitle>
            <CardDescription>Monthly requests vs approvals and rejections</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={leavePatterns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "#f3f4f6" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Total Requests"
                />
                <Line
                  type="monotone"
                  dataKey="approvals"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Approved"
                />
                <Line
                  type="monotone"
                  dataKey="rejections"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Rejected"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Peak Period:</strong> March shows the highest leave requests with 5 total requests, suggesting seasonal leave patterns.
            </p>
            <p>
              <strong>Approval Success:</strong> {approvalRate}% of all leave requests are approved, indicating healthy leave management practices.
            </p>
            <p>
              <strong>Department Insight:</strong> Operations department shows higher leave utilization (avg 13.1 days) compared to HR (avg 8.5 days).
            </p>
            <p>
              <strong>Leave Type Preference:</strong> Annual leave is the most utilized type at 75% utilization, while compassionate leave remains underutilized.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
