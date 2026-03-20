import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, CheckCircle2, XCircle, FileText, ChevronRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

// Re-index trigger

export function PersonalInsightsPage() {
  const { data: stats, isLoading } = trpc.analytics.getMyStats.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const statusData = [
    { name: "Approved", value: stats?.approved || 0 },
    { name: "Pending", value: stats?.pending || 0 },
    { name: "Rejected", value: stats?.rejected || 0 },
  ].filter(d => d.value > 0);

  return (
    <DashboardLayout>
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Insights</h1>
        <p className="text-slate-500 mt-1">Personal analytics and request history overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Requests</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.total}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Approved</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats?.approved}</h3>
              </div>
              <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Avg. Time (SLA)</p>
                <h3 className="text-2xl font-bold text-orange-600 mt-1">{stats?.avgProcessingTimeHours}h</h3>
              </div>
              <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Efficiency</p>
                <h3 className="text-2xl font-bold text-blue-600 mt-1">
                  {stats && stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                </h3>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle>Request Trends (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {stats?.monthlyTrends && stats.monthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyTrends}>
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="_count.id" name="Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  No trend data available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  No data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button 
          onClick={() => setLocation("/requests")}
          className="flex items-center gap-2 text-blue-600 font-semibold hover:underline"
        >
          View Full Request History
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
    </DashboardLayout>
  );
}
