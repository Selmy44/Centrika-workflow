import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/lib/trpc";
import { FileText, Car, DollarSign, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { formatDateTime } from "@/lib/dateFormatter";

export default function ApprovalHistory() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: approvalHistory, isLoading } = (trpc as any).requests.getApprovalHistory.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const getRequestIcon = (type: string) => {
    switch (type) {
      case "leave":
        return <FileText className="text-blue-400" size={20} />;
      case "car":
        return <Car className="text-purple-400" size={20} />;
      case "expenditure":
        return <DollarSign className="text-green-400" size={20} />;
      default:
        return null;
    }
  };

  const filteredRequests = useMemo(() => {
    if (!approvalHistory) return [];
    return approvalHistory.filter((req: any) =>
      req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [approvalHistory, searchTerm]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Approval History</h1>
          <p className="text-muted-foreground mt-2">View complete approval history of all requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviewed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "-" : approvalHistory?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {isLoading ? "-" : approvalHistory?.filter((r: any) => r.status === "approved").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {isLoading ? "-" : approvalHistory?.filter((r: any) => r.status === "rejected").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {isLoading ? "-" : approvalHistory?.filter((r: any) => r.status === "pending").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by title, type, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-input border-border"
          />
        </div>

        {/* Approval History List */}
        <div>
          {isLoading ? (
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-accent" size={32} />
                </div>
              </CardContent>
            </Card>
          ) : !filteredRequests || filteredRequests.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">
                  {approvalHistory?.length === 0 ? "No approval history yet" : "No results matching your search"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request: any) => (
                <Card key={request.id} className="bg-card border-border hover:border-accent transition-colors">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-muted rounded-lg">{getRequestIcon(request.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{request.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.type.charAt(0).toUpperCase() + request.type.slice(1)} • {formatDateTime(request.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Reviewed on</p>
                          <p className="text-sm font-medium text-foreground">
                            {request.approvalDate ? formatDateTime(request.approvalDate) : "N/A"}
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                    </div>

                    {request.comments && (
                      <div className="mt-3 p-3 bg-muted/50 rounded border border-border text-sm text-foreground">
                        <p className="font-medium mb-1">Approval Comments:</p>
                        <p className="text-muted-foreground">{request.comments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
