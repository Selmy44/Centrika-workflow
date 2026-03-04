import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Table } from "recharts";
import { TrendingUp, DollarSign, AlertCircle, Plus, Filter } from "lucide-react";
import { useState } from "react";

const expenditures = [
  { id: 1, date: "2024-06-15", description: "Office Supplies", category: "Operations", amount: 15000, status: "Approved", submittedBy: "John Muigai" },
  { id: 2, date: "2024-06-14", description: "Team Lunch", category: "Meals", amount: 8500, status: "Pending", submittedBy: "Sarah Kipchoge" },
  { id: 3, date: "2024-06-13", description: "Software License", category: "IT", amount: 45000, status: "Approved", submittedBy: "Mike Kamau" },
  { id: 4, date: "2024-06-12", description: "Travel to Kampala", category: "Travel", amount: 25000, status: "Approved", submittedBy: "Emily Kariuki" },
  { id: 5, date: "2024-06-11", description: "Client Meeting Refreshments", category: "Meals", amount: 5500, status: "Rejected", submittedBy: "David Ochieng" },
  { id: 6, date: "2024-06-10", description: "Equipment Maintenance", category: "Operations", amount: 30000, status: "Pending", submittedBy: "Grace Muturi" },
];

const categoryData = [
  { category: "Operations", total: 45000, percentage: 25 },
  { category: "IT", total: 85000, percentage: 47 },
  { category: "Travel", total: 25000, percentage: 14 },
  { category: "Meals", total: 14000, percentage: 8 },
  { category: "Training", total: 10000, percentage: 6 },
];

const monthlyData = [
  { month: "Jan", operations: 30000, it: 45000, travel: 15000, meals: 8000 },
  { month: "Feb", operations: 25000, it: 55000, travel: 20000, meals: 10000 },
  { month: "Mar", operations: 35000, it: 65000, travel: 18000, meals: 12000 },
  { month: "Apr", operations: 28000, it: 50000, travel: 22000, meals: 9000 },
  { month: "May", operations: 32000, it: 60000, travel: 25000, meals: 11000 },
  { month: "Jun", operations: 45000, it: 85000, travel: 25000, meals: 14000 },
];

export default function ExpenditureTracking() {
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<string | null>(null);

  const filteredExpenditures = filter 
    ? expenditures.filter(e => e.status === filter)
    : expenditures;

  const totalAmount = expenditures.reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = expenditures.filter(e => e.status === "Approved").reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = expenditures.filter(e => e.status === "Pending").reduce((sum, e) => sum + e.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Operations": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "IT": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Travel": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Meals": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "Training": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    };
    return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Expenditure Tracking
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor and manage company expenditures
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            New Expenditure
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                KES {(totalAmount / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This period
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
                KES {(approvedAmount / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {expenditures.filter(e => e.status === "Approved").length} items
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
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                KES {(pendingAmount / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {expenditures.filter(e => e.status === "Pending").length} items
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {expenditures.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                total records
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Expenditure Trend
              </CardTitle>
              <CardDescription>Spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
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
                  <Bar dataKey="operations" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="it" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="travel" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="meals" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Spending by Category
              </CardTitle>
              <CardDescription>Distribution of expenditures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((cat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {cat.category}
                      </span>
                      <Badge variant="outline">
                        KES {(cat.total / 1000).toFixed(0)}K
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {cat.percentage}% of total
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === null ? "default" : "outline"}
            onClick={() => setFilter(null)}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === "Approved" ? "default" : "outline"}
            onClick={() => setFilter("Approved")}
            size="sm"
          >
            Approved
          </Button>
          <Button
            variant={filter === "Pending" ? "default" : "outline"}
            onClick={() => setFilter("Pending")}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={filter === "Rejected" ? "default" : "outline"}
            onClick={() => setFilter("Rejected")}
            size="sm"
          >
            Rejected
          </Button>
        </div>

        {/* Recent Expenditures Table */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle>Recent Expenditures</CardTitle>
            <CardDescription>Latest transactions and requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Submitted By
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenditures.map((exp) => (
                    <tr
                      key={exp.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                        {exp.description}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getCategoryColor(exp.category)}>
                          {exp.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">
                        KES {(exp.amount / 1000).toFixed(0)}K
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {exp.submittedBy}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(exp.status)}>
                          {exp.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Expenditure Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Submission Deadline:</strong> All expenditure receipts must be submitted within 7 days of purchase.
            </p>
            <p>
              <strong>Documentation:</strong> Please attach receipts or invoices for all transactions above KES 5,000.
            </p>
            <p>
              <strong>Approval Process:</strong> Expenditures are reviewed and approved by the Finance team within 3-5 business days.
            </p>
            <p>
              <strong>Budget Categories:</strong> Ensure expenditures are categorized correctly for accurate budget tracking.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
