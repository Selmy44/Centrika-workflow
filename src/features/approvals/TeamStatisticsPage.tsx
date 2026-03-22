import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Users, TrendingUp, Award, Loader2 } from "lucide-react";

export default function TeamStatistics() {
  const { user, isAuthenticated } = useAuth();

  const { data: teamStats, isLoading } = trpc.requests.getTeamStatistics.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#3b6dae] dark:text-[#c79d2d]">Team Statistics</h1>
          <p className="text-muted-foreground mt-2">Overview of team member request activity and performance</p>
        </div>

        {/* Team Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "-" : teamStats?.totalMembers || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Active department members</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Avg Requests/Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "-" : `${((teamStats?.totalRequests || 0) / (teamStats?.totalMembers || 1)).toFixed(1) || 0}`}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Per team member</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-500" />
                Team Approval Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "-" : `${Math.round(((teamStats?.approvedCount || 0) / (teamStats?.totalRequests || 1)) * 100) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Overall team success</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Member Performance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Member Performance
            </CardTitle>
            <CardDescription>Individual member request statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-accent" size={32} />
              </div>
            ) : !teamStats?.teamMembers || teamStats.teamMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No team members found</p>
            ) : (
              <div className="space-y-4">
                {teamStats.teamMembers.map((member: any) => (
                  <div key={member.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.profileImage} alt={member.name} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{member.requestCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Total requests</p>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-500">{member.approvedCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Approved</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-red-500">{member.rejectedCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Rejected</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-yellow-500">{member.pendingCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Department Summary</CardTitle>
            <CardDescription>Overall department performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-accent" size={32} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Total Requests</span>
                  <span className="text-lg font-bold">{teamStats?.totalRequests || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <span className="text-sm font-medium">Approved</span>
                  <span className="text-lg font-bold text-green-500">{teamStats?.approvedCount || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                  <span className="text-sm font-medium">Rejected</span>
                  <span className="text-lg font-bold text-red-500">{teamStats?.rejectedCount || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <span className="text-sm font-medium">Pending</span>
                  <span className="text-lg font-bold text-yellow-500">{teamStats?.pendingCount || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
