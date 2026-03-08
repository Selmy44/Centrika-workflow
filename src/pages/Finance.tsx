import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/dateFormatter";
import { Loader2, DollarSign, CheckCircle, Clock, XCircle, FileText, Car, History } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Finance() {
  const { user, isAuthenticated, hasRole } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stats, isLoading: statsLoading } = trpc.requests.getDashboardStats.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: expenditures, isLoading: expendLoading } = trpc.requests.getApprovedExpenditures.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: pendingRequests, isLoading: pendingLoading, refetch } = trpc.requests.listPendingApprovals.useQuery(undefined, {
    enabled: isAuthenticated && hasRole("head_of_finance"),
    staleTime: 10000,
  });

  const approveMutation = trpc.requests.approveRequest.useMutation({
    onSuccess: () => {
      toast.success("Request approved successfully");
      setShowApproveDialog(false);
      setComments("");
      setSelectedRequest(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve request");
    },
  });

  const rejectMutation = trpc.requests.rejectRequest.useMutation({
    onSuccess: () => {
      toast.success("Request rejected");
      setShowRejectDialog(false);
      setComments("");
      setSelectedRequest(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject request");
    },
  });

  const hasAccess = useMemo(() => {
    return user && (hasRole("head_of_finance") || ["admin", "hr", "ceo_md"].includes(user.role));
  }, [user, hasRole]);

  // Filter requests based on search term
  const filteredPendingRequests = useMemo(() => {
    return pendingRequests?.filter((request: any) =>
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id?.toString().includes(searchTerm)
    ) || [];
  }, [pendingRequests, searchTerm]);

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

  const formatDate = (date: Date | string) => {
    return formatDateTime(date);
  };

  const handleApprove = (request: any) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate({
        requestId: selectedRequest.id,
        comments: comments.trim() || undefined,
      });
    }
  };

  const confirmReject = () => {
    if (selectedRequest && comments.trim()) {
      rejectMutation.mutate({
        requestId: selectedRequest.id,
        comments: comments.trim(),
      });
    } else {
      toast.error("Please provide a reason for rejection");
    }
  };

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You do not have permission to access the finance dashboard.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Finance Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Monitor expenditures, approve requests, and track financial operations
            </p>
          </div>
          <Link href="/expenditure-history">
            <Button variant="outline" className="flex items-center gap-2">
              <History size={18} />
              View History
            </Button>
          </Link>
        </div>

        {/* Finance Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.totalRequests || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All requests in system</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock size={16} className="text-yellow-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statsLoading ? "-" : stats?.pendingRequests || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsLoading ? "-" : stats?.approvedRequests || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Successfully approved</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle size={16} className="text-red-500" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statsLoading ? "-" : stats?.rejectedRequests || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Declined requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Approved Expenditure Summary */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="text-green-500" size={24} />
              Total Approved Expenditures
            </CardTitle>
            <CardDescription>Real-time tracking of all approved expenditure amounts by currency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-colors">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">RWF APPROVED</p>
                  <p className="text-3xl font-bold text-green-600">
                    {expendLoading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      `${(expenditures?.rwf || 0).toLocaleString()} RWF`
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Rwandan Francs</p>
                </div>
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">USD APPROVED</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {expendLoading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      `${(expenditures?.usd || 0).toLocaleString()} USD`
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">US Dollars</p>
                </div>
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">EUR APPROVED</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {expendLoading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      `${(expenditures?.eur || 0).toLocaleString()} EUR`
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Euros</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <DollarSign size={14} />
                <p>
                  These totals reflect all expenditure requests that have been approved through the complete approval chain.
                  The amounts update in real-time as new expenditures are approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals Section - Only for head_of_finance */}
        {hasRole("head_of_finance") && (
          <Card className="bg-card border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="text-yellow-500" size={24} />
                Pending Approvals from HR
              </CardTitle>
              <CardDescription>
                Review and approve expenditure requests that have been approved by HR
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Modern compact search bar */}
              {!pendingLoading && pendingRequests && pendingRequests.length > 0 && (
                <div className="flex justify-end mb-6">
                  <div className="relative">
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48 h-10 pl-10 text-sm rounded-lg border border-border bg-muted/50 focus:bg-background transition-colors"
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}

              {pendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-accent" size={32} />
                </div>
              ) : !pendingRequests || pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                  <p className="text-foreground font-medium mb-2">All caught up!</p>
                  <p className="text-sm text-muted-foreground">
                    There are no pending expenditure requests awaiting your approval.
                  </p>
                </div>
              ) : filteredPendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No requests match your search</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPendingRequests.map((request: any) => (
                    <Card key={request.id} className="bg-muted/30 border-border hover:border-accent transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                              {getRequestIcon(request.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <h3 className="font-semibold text-foreground text-lg">{request.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Request
                                  </p>
                                </div>
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1 shrink-0">
                                  <Clock size={14} />
                                  Pending
                                </Badge>
                              </div>

                              {request.description && (
                                <p className="text-sm text-foreground mt-2 line-clamp-2">{request.description}</p>
                              )}

                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span>Request ID: #{request.id}</span>
                                <span>•</span>
                                <span>Submitted: {formatDate(request.createdAt)}</span>
                              </div>

                              <div className="flex items-center gap-3 mt-4">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApprove(request)}
                                  disabled={approveMutation.isPending || rejectMutation.isPending}
                                >
                                  <CheckCircle size={16} className="mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleReject(request)}
                                  disabled={approveMutation.isPending || rejectMutation.isPending}
                                >
                                  <XCircle size={16} className="mr-2" />
                                  Reject
                                </Button>
                                <Link href={`/requests/${request.id}`}>
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Finance Role Info Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Finance Dashboard Capabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Monitor Expenditures:</strong> Track all approved expenditure amounts in real-time across multiple currencies
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Approve Requests:</strong> Review and approve expenditure requests that have passed HR approval
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>View History:</strong> Access complete expenditure history with detailed purchase information
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Financial Oversight:</strong> Maintain accountability and track approval chain progress for all financial requests
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Request</DialogTitle>
              <DialogDescription>
                You are about to approve "{selectedRequest?.title}". This action will move the request to the next approval stage.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Comments (Optional)</label>
                <Textarea
                  placeholder="Add any comments or notes..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={confirmApprove}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
              <DialogDescription>
                You are about to reject "{selectedRequest?.title}". Please provide a reason for rejection.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Reason for Rejection <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder="Please explain why this request is being rejected..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-2"
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                disabled={rejectMutation.isPending || !comments.trim()}
              >
                {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
