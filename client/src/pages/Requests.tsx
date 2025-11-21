import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, Car, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function Requests() {
  const { isAuthenticated } = useAuth();
  const { data: requests, isLoading } = trpc.requests.listUserRequests.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "draft":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Requests</h1>
            <p className="text-muted-foreground mt-2">View and manage all your requests</p>
          </div>
          <div className="flex gap-2">
            <Link href="/requests/leave">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">New Leave Request</Button>
            </Link>
            <Link href="/requests/car">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">New Car Request</Button>
            </Link>
            <Link href="/requests/expenditure">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">New Expenditure</Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-accent" size={32} />
              </div>
            </CardContent>
          </Card>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((request) => (
              <Link key={request.id} href={`/requests/${request.id}`}>
                <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-muted rounded-lg">{getRequestIcon(request.type)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{request.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Request
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Created on {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground mb-4">No requests yet</p>
                <p className="text-sm text-muted-foreground mb-6">Create your first request to get started</p>
                <div className="flex gap-2 justify-center">
                  <Link href="/requests/leave">
                    <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">
                      Create Leave Request
                    </Button>
                  </Link>
                  <Link href="/requests/car">
                    <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">
                      Create Car Request
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
