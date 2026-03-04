import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, AlertCircle, TrendingDown } from "lucide-react";

const quarterlyBudget = [
  { quarter: "Q1", budgeted: 450000, spent: 380000, remaining: 70000 },
  { quarter: "Q2", budgeted: 450000, spent: 420000, remaining: 30000 },
  { quarter: "Q3", budgeted: 450000, spent: 350000, remaining: 100000 },
  { quarter: "Q4", budgeted: 450000, spent: 280000, remaining: 170000 },
];

const departmentBudget = [
  { department: "Engineering", budgeted: 600000, spent: 580000, percent: 97 },
  { department: "Sales", budgeted: 400000, spent: 350000, percent: 88 },
  { department: "Marketing", budgeted: 250000, spent: 200000, percent: 80 },
  { department: "Operations", budgeted: 200000, spent: 180000, percent: 90 },
  { department: "HR", budgeted: 150000, spent: 120000, percent: 80 },
];

const expenseBreakdown = [
  { category: "Salaries", value: 3200000, percent: 60 },
  { category: "Benefits", value: 800000, percent: 15 },
  { category: "Operations", value: 600000, percent: 11 },
  { category: "Training", value: 400000, percent: 7 },
  { category: "Other", value: 200000, percent: 7 },
];

const monthlyTrend = [
  { month: "Jan", budgeted: 350000, spent: 320000, forecasted: 340000 },
  { month: "Feb", budgeted: 350000, spent: 340000, forecasted: 345000 },
  { month: "Mar", budgeted: 350000, spent: 330000, forecasted: 335000 },
  { month: "Apr", budgeted: 350000, spent: 315000, forecasted: 330000 },
  { month: "May", budgeted: 350000, spent: 325000, forecasted: 340000 },
  { month: "Jun", budgeted: 350000, spent: 310000, forecasted: 315000 },
];

const EXPENSE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function BudgetAnalysis() {
  const { isAuthenticated } = useAuth();

  const totalBudgeted = quarterlyBudget.reduce((sum, q) => sum + q.budgeted, 0);
  const totalSpent = quarterlyBudget.reduce((sum, q) => sum + q.spent, 0);
  const totalRemaining = quarterlyBudget.reduce((sum, q) => sum + q.remaining, 0);
  const spendRate = Math.round((totalSpent / totalBudgeted) * 100);
  const overBudgetDepts = departmentBudget.filter(d => d.percent > 95).length;

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Budget Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Financial overview, department budgets, and expenditure tracking
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Budgeted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                KES {(totalBudgeted / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Annual budget
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                KES {(totalSpent / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                YTD expenses
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
                KES {(totalRemaining / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Available budget
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Spend Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {spendRate}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                of total budget
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quarterly Trend */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quarterly Budget vs Spend
              </CardTitle>
              <CardDescription>Budgeted vs actual spending per quarter</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quarterlyBudget}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="quarter" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1f2937", 
                      border: "1px solid #374151",
                      borderRadius: "8px"
                    }}
                    labelStyle={{ color: "#f3f4f6" }}
                    formatter={(value) => [`KES ${(value / 1000).toFixed(0)}K`, '']}
                  />
                  <Legend />
                  <Bar dataKey="budgeted" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Budgeted" />
                  <Bar dataKey="spent" fill="#ef4444" radius={[8, 8, 0, 0]} name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Expense Breakdown
              </CardTitle>
              <CardDescription>Distribution of total expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category}: ${percent}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1f2937", 
                      border: "1px solid #374151",
                      borderRadius: "8px"
                    }}
                    labelStyle={{ color: "#f3f4f6" }}
                    formatter={(value) => `KES ${(value / 1000000).toFixed(1)}M`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Department Budget Status */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Department Budget Status
            </CardTitle>
            <CardDescription>Budget utilization by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={departmentBudget}>
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
                  formatter={(value) => `KES ${(value / 1000).toFixed(0)}K`}
                />
                <Legend />
                <Bar dataKey="budgeted" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Budgeted" />
                <Bar dataKey="spent" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Spending Trend
            </CardTitle>
            <CardDescription>Actual vs forecasted monthly spending</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
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
                  formatter={(value) => `KES ${(value / 1000).toFixed(0)}K`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="budgeted"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Budgeted"
                />
                <Line
                  type="monotone"
                  dataKey="spent"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Actual Spend"
                />
                <Line
                  type="monotone"
                  dataKey="forecasted"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#10b981", r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Forecasted"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Details Table */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle>Department Budget Details</CardTitle>
            <CardDescription>Detailed spending information per department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departmentBudget.map((dept, index) => (
                <div key={index} className="pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {dept.department}
                    </span>
                    <Badge variant={dept.percent > 95 ? "destructive" : "secondary"}>
                      {dept.percent}% used
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        dept.percent > 95 ? "bg-red-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${dept.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>KES {(dept.spent / 1000).toFixed(0)}K spent</span>
                    <span>of KES {(dept.budgeted / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alert Card */}
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Watch:</strong> {overBudgetDepts} department(s) are approaching budget limits (&gt;95% utilization).
            </p>
            <p>
              <strong>Forecast:</strong> Based on current spending trends, the company is expected to remain within budget by end of year.
            </p>
            <p>
              <strong>Q2 Alert:</strong> Q2 spending was high at {quarterlyBudget[1].spent - quarterlyBudget[1].remaining} with only KES {quarterlyBudget[1].remaining / 1000}K remaining.
            </p>
            <p>
              <strong>Action Required:</strong> Engineering department budget utilization is at 97%. Review upcoming projects and allocations.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
