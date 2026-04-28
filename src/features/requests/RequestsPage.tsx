import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { CreateRequestDialog } from "@/components/CreateRequestDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, FileText, Car, DollarSign, RefreshCw, CheckCircle2, XCircle, Clock, Trash2, Package, Edit, Search } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { RequestIcon } from "@/components/shared/RequestIcon";
import { SearchInput } from "@/components/shared/SearchInput";

export default function Requests() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: requests, isLoading, refetch } = trpc.requests.listUserRequests.useQuery({ includeNonSubmitted: true }, {
    enabled: isAuthenticated,
  });

  // Filter requests based on search term
  const filteredRequests = useMemo(() => {
    return requests?.filter((req: any) =>
      req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.type?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [requests, searchTerm]);

  const cancelMutation = trpc.requests.cancelRequest.useMutation({
    onSuccess: () => {
      toast.success("Request cancelled successfully");
      setShowCancelDialog(false);
      setCancelReason("");
      setSelectedRequest(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel request");
    },
  });

  if (!isAuthenticated) {
    return null;
  }




  const formatDate = (date: Date) => {
    return formatDateTime(date);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 lg:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#3b6dae] dark:text-[#c79d2d]">My Requests</h1>
            <p className="text-muted-foreground mt-2 text-sm">View and manage all your requests</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto">
            {/* Premium animated search bar on the right */}
            <div className="relative group transition-all duration-300 z-10 w-full sm:w-64 shrink-0 focus-within:w-full sm:focus-within:w-80">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3b6dae] to-[#c79d2d] rounded-xl blur opacity-0 group-hover:opacity-20 group-focus-within:opacity-30 transition duration-500"></div>
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-slate-400 group-focus-within:text-[#3b6dae] transition-colors z-10" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-sm focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 focus:ring-2 focus:ring-[#3b6dae]/20 focus:border-[#3b6dae]/40"
                />
              </div>
            </div>
            <div className="shrink-0">
              <CreateRequestDialog />
            </div>
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
          filteredRequests.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {filteredRequests.map((request: any) => (
                <Card key={request.id} className="bg-card border-border">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <Link href={`/requests/${request.id}`} className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 sm:gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                          <div className="p-2 bg-muted rounded-lg shrink-0">
                            <RequestIcon type={request.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{request.title}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Request
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Created on {formatDate(request.createdAt)}
                            </p>
                          </div>
                        </div>
                      </Link>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:shrink-0">
                        <div className="shrink-0">
                          <StatusBadge status={request.status} />
                        </div>
                        {request.status === "draft" && (
                          <Link href={`/requests/${request.id}`} className="w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                            >
                              <Edit size={16} className="mr-1" />
                              Edit
                            </Button>
                          </Link>
                        )}
                        {(request.status === "pending" || request.status === "draft") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto text-red-600 border-red-500/30 hover:bg-red-500/10"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedRequest(request);
                              setShowCancelDialog(true);
                            }}
                          >
                            <Trash2 size={16} className="mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No requests match your search</p>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground mb-2">No requests yet</p>
                <p className="text-sm text-muted-foreground">Create your first request to get started</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel Request Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel "{selectedRequest?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason for cancellation (Optional)</label>
                <Textarea
                  placeholder="Why are you cancelling this request?"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason("");
                }}
              >
                Keep Request
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await cancelMutation.mutateAsync({
                    requestId: selectedRequest.id,
                    reason: cancelReason,
                  });
                }}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelling..." : "Cancel Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
