import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, Calendar, AlertCircle } from "lucide-react";

const departmentData = [
  { month: "Jan", requests: 4, approvals: 3, pending: 1 },
  { month: "Feb", requests: 3, approvals: 3, pending: 0 },
  { month: "Mar", requests: 5, approvals: 4, pending: 1 },
  { month: "Apr", requests: 6, approvals: 5, pending: 1 },
  { month: "May", requests: 2, approvals: 2, pending: 0 },
  { month: "Jun", requests: 4, approvals: 4, pending: 0 },
];

const teamMembers = [
  { name: "John Muigai", role: "Senior Developer", status: "Active", leaveTaken: 5 },
  { name: "Sarah Kipchoge", role: "Product Manager", status: "Active", leaveTaken: 3 },
  { name: "Mike Kamau", role: "UI Designer", status: "On Leave", leaveTaken: 8 },
  { name: "Emily Kariuki", role: "Data Analyst", status: "Active", leaveTaken: 2 },
  { name: "David Ochieng", role: "QA Engineer", status: "Active", leaveTaken: 4 },
];

const leaveBreakdown = [
  { name: "Annual Leave", value: 45 },
  { name: "Sick Leave", value: 28 },
  { name: "Casual Leave", value: 20 },
  { name: "Compassionate Leave", value: 7 },
];

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];

export default function DepartmentReport() {
  const { isAuthenticated } = useAuth();
  const totalRequests = departmentData.reduce((sum, d) => sum + d.requests, 0);
  const totalApprovals = departmentData.reduce((sum, d) => sum + d.approvals, 0);
  const totalPending = departmentData.reduce((sum, d) => sum + d.pending, 0);
  const totalLeave = leaveBreakdown.reduce((sum, d) => sum + d.value, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Pending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Department Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Overview of team metrics, leave trends, and approval statistics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalRequests}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This year
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
                {totalApprovals}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {Math.round((totalApprovals / totalRequests) * 100)}% approval rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {totalPending}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {teamMembers.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Active employees
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leave Requests Trend */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Leave Requests Trend
              </CardTitle>
              <CardDescription>Monthly requests, approvals, and pending</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
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
                  <Bar dataKey="requests" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="approvals" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Leave Type Breakdown */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Breakdown
              </CardTitle>
              <CardDescription>Distribution across leave types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leaveBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leaveBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1f2937", 
                      border: "1px solid #374151",
                      borderRadius: "8px"
                    }}
                    labelStyle={{ color: "#f3f4f6" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Table */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>Current status and leave usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Days Used
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                        {member.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {member.role}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(member.status)}>
                          {member.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {member.leaveTaken} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Department Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Total Leave Taken:</strong> {totalLeave} days across the department this year
            </p>
            <p>
              <strong>Average Leave Per Employee:</strong> {Math.round(totalLeave / teamMembers.length)} days
            </p>
            <p>
              <strong>Approval Rate:</strong> {Math.round((totalApprovals / totalRequests) * 100)}% of all requests have been approved
            </p>
            <p>
              <strong>Pending Review:</strong> {totalPending} requests are awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
