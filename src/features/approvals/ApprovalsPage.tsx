import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileReviewComponent } from "@/components/FileReviewComponent";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import LeaveRequestForm from "@/components/forms/LeaveRequestForm";
import CarRequestApprovalView from "@/components/forms/CarRequestApprovalView";
import ExpenditureRequestApprovalView from "@/components/forms/ExpenditureRequestApprovalView";
import AssetRequestApprovalView from "@/components/forms/AssetRequestApprovalView";
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
import { Loader2, FileText, Car, DollarSign, CheckCircle, XCircle, Clock, Eye, Package } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Approvals() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(useSearch());
  const requestIdFromUrl = searchParams.get("requestId");
  const autoOpenAttempted = useRef(false);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showFilesDialog, setShowFilesDialog] = useState(false);
  const [showFullFormDialog, setShowFullFormDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [approverSignatureUrl, setApproverSignatureUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: pendingRequests, isLoading, refetch } = (trpc as any).requests.listPendingApprovals.useQuery(undefined, {
    // Only fetch if they're logged in and have an approver role (or additional roles that imply approval access)
    enabled: isAuthenticated && (user?.role !== "user" || !!user?.additionalRoles),
  });

  // Filter requests based on search term
  const filteredRequests = pendingRequests?.filter((request: any) =>
    request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.userId?.toString().includes(searchTerm)
  ) || [];

  // Auto-open request if coming from notification link - only try once per URL
  useEffect(() => {
    if (requestIdFromUrl && pendingRequests && !autoOpenAttempted.current) {
      const request = pendingRequests.find((r: any) => r.id === parseInt(requestIdFromUrl));
      if (request) {
        autoOpenAttempted.current = true;
        setSelectedRequest(request);
        setShowFullFormDialog(true);
      }
    }
  }, [requestIdFromUrl, pendingRequests]);

  const { data: requestFiles, isLoading: filesLoading } = (trpc as any).requests.getRequestFilesForReview.useQuery(
    { requestId: selectedRequest?.id || 0 },
    { enabled: showFilesDialog && !!selectedRequest?.id }
  );

  const approveMutation = (trpc as any).requests.approveRequest.useMutation({
    onSuccess: () => {
      toast.success("Request approved successfully");
      setShowApproveDialog(false);
      setShowFullFormDialog(false);
      setComments("");
      setSelectedRequest(null);
      // Refresh the list to remove the approved request
      refetch();
      // Invalidate dashboard stats so counts update in real-time
      queryClient.invalidateQueries({ queryKey: ["requests", "getDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["requests", "getRecentRequests"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve request");
    },
  });

  const rejectMutation = (trpc as any).requests.rejectRequest.useMutation({
    onSuccess: () => {
      toast.success("Request rejected");
      setShowRejectDialog(false);
      setComments("");
      setSelectedRequest(null);
      refetch();
      // Invalidate dashboard stats so counts update in real-time
      queryClient.invalidateQueries({ queryKey: ["requests", "getDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["requests", "getRecentRequests"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject request");
    },
  });

  const storeFormData = (trpc as any).requests.storeLeaveFormData.useMutation();

  // Dynamic query for fetching form data when approving
  const getFormDataDynamic = (trpc as any).requests.getLeaveFormData.useQuery(
    { requestId: selectedRequest?.id || 0 },
    { enabled: !!selectedRequest?.id && selectedRequest?.type === "leave" } // Only for leave requests
  );

  if (!isAuthenticated) {
    return null;
  }

  // Regular employees without any additional roles don't have approval responsibilities
  if (user?.role === "user" && !user?.additionalRoles) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No Approvals</CardTitle>
              <CardDescription>You don't have any pending requests to approve</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Only managers and administrators can approve requests.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getRequestIcon = (type: string) => {
    switch (type) {
      case "leave":
        return <FileText className="text-blue-400" size={20} />;
      case "car":
        return <Car className="text-purple-400" size={20} />;
      case "expenditure":
        return <DollarSign className="text-green-400" size={20} />;
      case "asset":
        return <Package className="text-orange-400" size={20} />;
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return formatDateTime(date);
  };

  const getApprovalLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      "head_of_department": "Department Head",
      "hr": "HR (Doreen MBABAZI)",
      "head_of_finance": "Head of Finance (Patrick NDABARASA)",
      "ceo_md": "CEO/MD",
      "final": "Final Approval",
    };
    return labels[level] || level;
  };

  const handleApprove = (request: any) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const addAttachmentMutation = (trpc as any).requests.addAttachment.useMutation();

  const confirmApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate({
        requestId: selectedRequest.id,
        comments: comments.trim() || undefined,
        signatureFileId: undefined, // For now, signature upload is optional
      });
    }
  };

  const confirmReject = () => {
    if (selectedRequest && comments.trim()) {
      // Rejections require a reason so the employee knows why
      rejectMutation.mutate({
        requestId: selectedRequest.id,
        comments: comments.trim(),
      });
    } else {
      toast.error("Please provide a reason for rejection");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pending Approvals</h1>
            <p className="text-muted-foreground mt-2">Review and approve employee requests</p>
          </div>

          {/* Modern compact search bar on the right */}
          {!isLoading && pendingRequests && pendingRequests.length > 0 && (
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
          )}
        </div>

        {isLoading ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                {/* Loading spinner while fetching data */}
                <Loader2 className="animate-spin text-accent" size={32} />
              </div>
            </CardContent>
          </Card>
        ) : !pendingRequests || pendingRequests.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                <p className="text-foreground font-medium mb-2">All caught up!</p>
                <p className="text-sm text-muted-foreground">There are no pending requests at the moment.</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No requests match your search</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request: any) => (
              <Card key={request.id} className="bg-card border-border hover:border-accent transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-muted rounded-lg">{getRequestIcon(request.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{request.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Request
                            </p>
                          </div>
                          <StatusBadge status={request.status || "pending"} size="sm" />
                        </div>

                        {request.description && (
                          <p className="text-sm text-foreground mt-2 line-clamp-2">{request.description}</p>
                        )}

                        {request.currentApprovalLevel && (
                          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
                            <p className="font-medium">Currently at: {getApprovalLevelLabel(request.currentApprovalLevel)}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3">
                          <p className="text-xs text-muted-foreground">
                            Request ID: #{request.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {formatDate(request.createdAt)}
                          </p>
                        </div>

                        {/* Approval action button - only View & Sign Form */}
                        <div className="flex items-center gap-3 mt-4 flex-wrap">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowFullFormDialog(true);
                            }}
                          >
                            <FileText size={16} className="mr-2" />
                            View & Sign Form
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Request</DialogTitle>
              <DialogDescription>
                You are about to approve "{selectedRequest?.title}". This action cannot be undone.
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
              <div>
                <label className="text-sm font-medium">Signature (Optional)</label>
                <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                    className="w-full"
                    title="Upload signature file"
                  />
                  {signatureFile && (
                    <p className="text-xs text-muted-foreground mt-2">Selected: {signatureFile.name}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowApproveDialog(false);
                setComments("");
                setSignatureFile(null);
              }}>
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
                You are about to reject "{selectedRequest?.title}". Please provide a reason.
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

        {/* Files Review Dialog */}
        <Dialog open={showFilesDialog} onOpenChange={setShowFilesDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye size={20} />
                Review Supporting Documents & Signatures
              </DialogTitle>
              <DialogDescription>
                {selectedRequest?.title} - Request ID #{selectedRequest?.id}
              </DialogDescription>
            </DialogHeader>

            {filesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-400 mr-2" />
                <span>Loading files...</span>
              </div>
            ) : requestFiles ? (
              <FileReviewComponent
                title={selectedRequest?.type === "leave" ? "Leave Request Documents" : "Supporting Documents"}
                files={requestFiles.attachments || []}
                showSignatures={selectedRequest?.type === "leave" && requestFiles.leaveSignatures}
                employeeSignature={requestFiles.leaveSignatures?.employeeSignature}
                managerSignature={requestFiles.leaveSignatures?.managerSignature}
                remainingDays={requestFiles.leaveSignatures?.leaveDaysRemaining}
              />
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto text-gray-500 mb-2" size={32} />
                <p className="text-gray-400">No documents found for this request</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFilesDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Full Form - Display as proper modal with navbar header */}
        {showFullFormDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col relative">
              {/* Navbar Header - Fixed at top */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedRequest?.title}
                </h2>
                <button
                  onClick={() => setShowFullFormDialog(false)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold text-2xl w-10 h-10 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Form Content */}
              <div className="overflow-y-auto flex-1">
                {selectedRequest ? (
                  <>
                    {/* ===== LEAVE REQUEST ===== */}
                    {selectedRequest.type === "leave" && (
                      <LeaveRequestForm
                        isApprover={true}
                        requestData={selectedRequest}
                        onApprove={(data) => {
                          const processApproval = async () => {
                            try {
                              const currentFormData = getFormDataDynamic.data;
                              console.log("[Approvals] Fetched current form data:", currentFormData ? Object.keys(currentFormData) : "NULL");
                              if (!currentFormData) {
                                const refetchResult = await getFormDataDynamic.refetch();
                                if (!refetchResult.data) {
                                  console.error("[Approvals] CRITICAL: No form data found for request", selectedRequest.id);
                                  toast.error("Cannot approve: Form data not found. Employee may not have properly submitted the form.");
                                  return;
                                }
                                Object.assign(currentFormData, refetchResult.data);
                              }
                              let signatureDataUrl = "";
                              if (data.signatureFile) {
                                await new Promise<void>((resolve, reject) => {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    signatureDataUrl = event.target?.result as string;
                                    resolve();
                                  };
                                  reader.onerror = () => reject(new Error("Failed to read signature file"));
                                  reader.readAsDataURL(data.signatureFile);
                                });
                              }
                              const level = selectedRequest?.currentApprovalLevel;
                              const signatureUpdate: any = {};
                              if (signatureDataUrl) {
                                // Default fallback used by legacy leave forms
                                signatureUpdate.approverSignatureUrl = signatureDataUrl;
                                // Dynamically assign based on approval level
                                if (level === "head_of_department") {
                                  signatureUpdate.managerSignatureUrl = signatureDataUrl;
                                } else if (level === "hr") {
                                  signatureUpdate.hrSignatureUrl = signatureDataUrl;
                                } else if (level === "head_of_finance") {
                                  signatureUpdate.financeSignatureUrl = signatureDataUrl;
                                } else if (level === "ceo_md" || level === "md") {
                                  signatureUpdate.ceoSignatureUrl = signatureDataUrl;
                                }
                              }

                              const updatedFormData = {
                                ...currentFormData,
                                ...signatureUpdate,
                                ...(data.comments && { approvalComments: data.comments }),
                              };
                              if (signatureDataUrl || data.comments) {
                                try {
                                  await storeFormData.mutateAsync({
                                    requestId: selectedRequest.id,
                                    formData: updatedFormData,
                                  });
                                  console.log("[Approvals] Form data stored successfully");
                                } catch (storeErr) {
                                  console.error("[Approvals] Failed to store form data:", storeErr);
                                  toast.error("Failed to save form with signature. Please try again.");
                                  return;
                                }
                              }
                              approveMutation.mutate({
                                requestId: selectedRequest.id,
                                comments: data.comments,
                                signatureFileId: undefined,
                              });
                            } catch (err) {
                              console.error("[Approvals] Error in processApproval:", err);
                              toast.error("An error occurred while processing the approval.");
                            }
                          };
                          processApproval();
                        }}
                        onReject={(reason) => {
                          rejectMutation.mutate({
                            requestId: selectedRequest.id,
                            comments: reason,
                          });
                          setShowFullFormDialog(false);
                        }}
                        isLoading={approveMutation.isPending || rejectMutation.isPending}
                      />
                    )}

                    {/* ===== CAR REQUEST ===== */}
                    {selectedRequest.type === "car" && (
                      <CarRequestApprovalView
                        requestData={selectedRequest}
                        onApprove={(data) => {
                          approveMutation.mutate({
                            requestId: selectedRequest.id,
                            comments: data.comments,
                            signatureFileId: undefined,
                          });
                        }}
                        onReject={(reason) => {
                          rejectMutation.mutate({
                            requestId: selectedRequest.id,
                            comments: reason,
                          });
                          setShowFullFormDialog(false);
                        }}
                        isLoading={approveMutation.isPending || rejectMutation.isPending}
                      />
                    )}

                    {/* ===== EXPENDITURE REQUEST ===== */}
                    {selectedRequest.type === "expenditure" && (
                      <ExpenditureRequestApprovalView
                        requestData={selectedRequest}
                        onApprove={(data) => {
                          approveMutation.mutate({
                            requestId: selectedRequest.id,
                            comments: data.comments,
                            signatureFileId: undefined,
                          });
                        }}
                        onReject={(reason) => {
                          rejectMutation.mutate({
                            requestId: selectedRequest.id,
                            comments: reason,
                          });
                          setShowFullFormDialog(false);
                        }}
                        isLoading={approveMutation.isPending || rejectMutation.isPending}
                      />
                    )}

                    {/* ===== ASSET REQUEST ===== */}
                    {selectedRequest.type === "asset" && (
                      <AssetRequestApprovalView
                        requestData={selectedRequest}
                        onApprove={(data) => {
                          approveMutation.mutate({
                            requestId: selectedRequest.id,
                            comments: data.comments,
                            signatureFileId: undefined,
                          });
                        }}
                        onReject={(reason) => {
                          rejectMutation.mutate({
                            requestId: selectedRequest.id,
                            comments: reason,
                          });
                          setShowFullFormDialog(false);
                        }}
                        isLoading={approveMutation.isPending || rejectMutation.isPending}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-blue-400 mr-2" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
