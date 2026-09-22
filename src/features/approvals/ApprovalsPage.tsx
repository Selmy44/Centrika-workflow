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
import SickLeaveForm from "@/components/forms/SickLeaveForm";
import PersonalLeaveForm from "@/components/forms/PersonalLeaveForm";
import UnpaidLeaveForm from "@/components/forms/UnpaidLeaveForm";
import AnnualLeaveForm from "@/components/forms/AnnualLeaveForm";
import CarRequestApprovalView from "@/components/forms/CarRequestApprovalView";
import ExpenditureRequestApprovalView from "@/components/forms/ExpenditureRequestApprovalView";
import AssetRequestApprovalView from "@/components/forms/AssetRequestApprovalView";
import { SignaturePad } from "@/components/SignaturePad";
import { FormSignatureSelector } from "@/components/forms/FormSignatureSelector";
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
import { Loader2, FileText, Car, DollarSign, CheckCircle, XCircle, Clock, Eye, Package, Search, Paperclip, ShieldCheck } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { FilterBar, parseUrlFilters, DEFAULT_FILTER, type FilterState } from "@/components/shared/FilterBar";

const base64ToFile = (base64: string, filename: string) => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export default function Approvals() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const requestIdFromUrl = searchParams.get("requestId");
  const autoOpenAttempted = useRef(false);

  // FilterBar state — initialized from URL params
  const [filters, setFilters] = useState<FilterState>(() => {
    const fromUrl = parseUrlFilters(searchString);
    return { ...DEFAULT_FILTER, ...fromUrl };
  });

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showFilesDialog, setShowFilesDialog] = useState(false);
  const [showFullFormDialog, setShowFullFormDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [approverSignatureUrl, setApproverSignatureUrl] = useState("");
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<"upload" | "draw">("draw");

  // Mark notifications as read when a form is opened
  const markReadByRequestId = (trpc as any).notifications.markReadByRequestId.useMutation();
  const saveSignatureToProfile = (trpc as any).auth.saveSignature.useMutation();

  const { data: pendingRequests, isLoading: pendingLoading, refetch } = (trpc as any).requests.listPendingApprovals.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
  });

  const { data: historyRequests, isLoading: historyLoading, refetch: refetchHistory } = (trpc as any).requests.listApprovalHistory.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
  });

  const isLoading = pendingLoading || historyLoading;

  // Combine and deduplicate: pending from listPendingApprovals + history from listApprovalHistory
  const allRequests = useMemo(() => {
    const map = new Map<number, any>();
    (pendingRequests || []).forEach((r: any) => map.set(r.id, r));
    (historyRequests || []).forEach((r: any) => { if (!map.has(r.id)) map.set(r.id, r); });
    return Array.from(map.values()).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [pendingRequests, historyRequests]);

  // Filter counts for the FilterBar badges
  const filterCounts = useMemo(() => ({
    all: allRequests.length,
    pending: allRequests.filter((r: any) => r.status === "pending").length,
    approved: allRequests.filter((r: any) => r.status === "approved").length,
    rejected: allRequests.filter((r: any) => r.status === "rejected").length,
  }), [allRequests]);

  // Apply all filters: status → type → date → search
  const filteredRequests = useMemo(() => {
    let result = allRequests;

    // Status filter
    if (filters.status !== "all") {
      result = result.filter((r: any) => r.status === filters.status);
    }

    // Type filter
    if (filters.types.length > 0) {
      result = result.filter((r: any) => filters.types.includes(r.type));
    }

    // Date filter
    if (filters.dateRange.from) {
      const from = filters.dateRange.from;
      result = result.filter((r: any) => new Date(r.createdAt) >= from);
    }
    if (filters.dateRange.to) {
      const to = new Date(filters.dateRange.to);
      to.setHours(23, 59, 59, 999);
      result = result.filter((r: any) => new Date(r.createdAt) <= to);
    }

    // Search filter
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter((r: any) =>
        r.title?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.type?.toLowerCase().includes(term) ||
        r.userId?.toString().includes(term)
      );
    }

    return result;
  }, [allRequests, filters]);

  // Auto-open request if coming from notification link - only try once per URL
  useEffect(() => {
    if (requestIdFromUrl && pendingRequests && !autoOpenAttempted.current) {
      const request = pendingRequests.find((r: any) => r.id === parseInt(requestIdFromUrl));
      if (request) {
        autoOpenAttempted.current = true;
        setSelectedRequest(request);
        setShowFullFormDialog(true);
        // Mark as read since we're opening directly from notification
        markReadByRequestId.mutate({ requestId: request.id });
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
      
      // Delay closing for 800ms so the user sees the spinner loading state and experiences a smooth, satisfying transition
      setTimeout(() => {
        setShowFullFormDialog(false);
        setComments("");
        setSelectedRequest(null);
        setIsProcessingApproval(false);
        // Refresh the list to remove the approved request
        refetch();
        refetchHistory();
        // Invalidate all request queries so everywhere updates in real-time
        queryClient.invalidateQueries({ queryKey: ["requests"] });
      }, 800);
    },
    onError: (error: any) => {
      setIsProcessingApproval(false);
      toast.error(error.message || "Failed to approve request");
    },
  });

  const rejectMutation = (trpc as any).requests.rejectRequest.useMutation({
    onSuccess: () => {
      toast.success("Request rejected");
      setShowRejectDialog(false);
      
      // Delay closing for 800ms so the user sees the spinner loading state and experiences a smooth, satisfying transition
      setTimeout(() => {
        setShowFullFormDialog(false);
        setComments("");
        setSelectedRequest(null);
        setIsProcessingApproval(false);
        refetch();
        refetchHistory();
        // Invalidate all request queries so everywhere updates in real-time
        queryClient.invalidateQueries({ queryKey: ["requests"] });
      }, 800);
    },
    onError: (error: any) => {
      setIsProcessingApproval(false);
      toast.error(error.message || "Failed to reject request");
    },
  });

  const storeFormData = (trpc as any).requests.storeLeaveFormData.useMutation();
  const storeCarFormData = (trpc as any).requests.storeCarFormData.useMutation();
  const storeExpenditureFormData = (trpc as any).requests.storeExpenditureFormData.useMutation();
  const storeAssetFormData = (trpc as any).requests.storeAssetFormData.useMutation();

  const getFormDataDynamic = (trpc as any).requests.getLeaveFormData.useQuery(
    { requestId: selectedRequest?.id || 0 },
    { enabled: !!selectedRequest?.id && selectedRequest?.type === "leave" }
  );
  
  const getCarFormDataDynamic = (trpc as any).requests.getCarFormData.useQuery(
    { requestId: selectedRequest?.id || 0 },
    { enabled: !!selectedRequest?.id && selectedRequest?.type === "car" }
  );

  const getExpenditureFormDataDynamic = (trpc as any).requests.getExpenditureFormData.useQuery(
    { requestId: selectedRequest?.id || 0 },
    { enabled: !!selectedRequest?.id && selectedRequest?.type === "expenditure" }
  );

  const getAssetFormDataDynamic = (trpc as any).requests.getAssetFormData.useQuery(
    { requestId: selectedRequest?.id || 0 },
    { enabled: !!selectedRequest?.id && selectedRequest?.type === "asset" }
  );

  const handleGenericApprove = async (data: any, type: string, dynamicQuery: any, storeMutation: any) => {
    setIsProcessingApproval(true);
    try {
      if (!selectedRequest) {
        setIsProcessingApproval(false);
        return;
      }
      
      const currentFormData = dynamicQuery.data || {};
      if (Object.keys(currentFormData).length === 0 && dynamicQuery.refetch) {
        const refetchResult = await dynamicQuery.refetch();
        if (refetchResult.data) {
          Object.assign(currentFormData, refetchResult.data);
        }
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
        if (type === "leave") {
          signatureUpdate.approverSignatureUrl = signatureDataUrl;
          signatureUpdate.approverSignerName = user?.name || "Approver";
        }
        
        if (level === "head_of_department") {
          signatureUpdate.managerSignatureUrl = signatureDataUrl;
          signatureUpdate.managerSignerName = user?.name || "Checked by";
          signatureUpdate.checkedByName = user?.name || "Checked by";
        } else if (level === "hr") {
          signatureUpdate.hrSignatureUrl = signatureDataUrl;
          signatureUpdate.hrSignerName = user?.name || "HR";
        } else if (level === "head_of_finance") {
          signatureUpdate.financeSignatureUrl = signatureDataUrl;
          signatureUpdate.financeSignerName = user?.name || "Reviewed by";
          signatureUpdate.reviewedByName = user?.name || "Reviewed by";
        } else if (level === "ceo_md" || level === "md") {
          signatureUpdate.ceoSignatureUrl = signatureDataUrl;
          signatureUpdate.ceoSignerName = user?.name || "Approved by (CEO / MD)";
          signatureUpdate.approvedByName = user?.name || "Approved by (CEO / MD)";
        }
      }

      const updatedFormData = {
        ...currentFormData,
        ...signatureUpdate,
        ...(data.comments && { approvalComments: data.comments }),
      };

      if (signatureDataUrl || data.comments) {
        try {
          await storeMutation.mutateAsync({
            requestId: selectedRequest.id,
            formData: updatedFormData,
          });
        } catch (storeErr) {
          console.error(`[Approvals] Failed to store ${type} form data:`, storeErr);
          toast.error("Failed to save form with signature. Please try again.");
          setIsProcessingApproval(false);
          return;
        }
      }

      approveMutation.mutate({
        requestId: selectedRequest.id,
        comments: data.comments,
        signatureFileId: undefined,
        escalateToCeo: data.escalateToCeo,
        nextApproverId: data.nextApproverId,
        isFinalApproval: data.isFinalApproval,
      });
    } catch (err) {
      console.error("[Approvals] Error in handleGenericApprove:", err);
      toast.error("An error occurred while processing the approval.");
      setIsProcessingApproval(false);
    }
  };

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
      "head_of_department": "Head of Department",
      "hr": "HR (Henry Ntaganzwa)",
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
      <div className="space-y-4 p-3 lg:space-y-6 lg:p-6">
        {/* Header section */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3b6dae] dark:text-[#c79d2d]">Approvals</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm">Review and manage employee requests</p>
          </div>
        </div>

        {/* Premium Filter Bar */}
        <FilterBar
          value={filters}
          onChange={setFilters}
          counts={filterCounts}
          syncUrl={true}
        />

        {isLoading ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-accent" size={32} />
              </div>
            </CardContent>
          </Card>
        ) : allRequests.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                <p className="text-foreground font-medium mb-2">No requests found</p>
                <p className="text-sm text-muted-foreground">There are no requests to display at the moment.</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No requests match your filters</p>
                <button
                  onClick={() => setFilters(DEFAULT_FILTER)}
                  className="mt-2 text-sm text-[#3b6dae] hover:underline font-semibold"
                >
                  Clear all filters
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredRequests.map((request: any) => (
              <Card key={request.id} className="bg-card border-border hover:border-accent transition-colors">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 lg:gap-4">
                      <div className="p-2 bg-muted rounded-lg">{getRequestIcon(request.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground text-sm sm:text-base">{request.title}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Request
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge status={request.status || "pending"} size="sm" />
                            {request.hasApproverDraft && request.status === "pending" && (
                              <StatusBadge status="draft_saved" size="sm" />
                            )}
                          </div>
                        </div>

                        {request.description && (
                          <p className="text-sm text-foreground mt-2 line-clamp-2">{request.description}</p>
                        )}

                        {request.currentApprovalLevel && request.status === "pending" && request.currentApprovalLevel !== "final" && (
                          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
                            <p className="font-medium">Currently at: {getApprovalLevelLabel(request.currentApprovalLevel)}</p>
                          </div>
                        )}

                        <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 mt-3">
                          <p className="text-xs text-muted-foreground">
                            Request ID: #{request.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {formatDate(request.createdAt)}
                          </p>
                        </div>

                        {/* Approval action button */}
                        <div className="flex items-center gap-3 mt-4 flex-wrap">
                          <Button
                            variant="default"
                            size="sm"
                            className={`w-full lg:w-auto ${request.status === "pending" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"}`}
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowFullFormDialog(true);
                              // Mark related notifications as read when form is opened
                              markReadByRequestId.mutate({ requestId: request.id });
                            }}
                          >
                            <FileText size={16} className="mr-2" />
                            {request.status === "pending" ? "View & Sign Form" : "View Form"}
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
                <div className="mt-2">
                  <FormSignatureSelector
                    value={approverSignatureUrl}
                    initialFile={signatureFile}
                    onChange={({ dataUrl, file, saveToProfile }) => {
                      setApproverSignatureUrl(dataUrl);
                      setSignatureFile(file);
                      if (saveToProfile && dataUrl) {
                        saveSignatureToProfile.mutate({ signatureUrl: dataUrl });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowApproveDialog(false);
                  setComments("");
                  setSignatureFile(null);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto min-w-[140px] bg-[#3b6dae] hover:bg-[#2d5a9e] text-white font-semibold text-xs transition-colors disabled:opacity-50"
                onClick={confirmApprove}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Approve & Sign
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
              <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={confirmReject}
                disabled={rejectMutation.isPending || !comments.trim()}
                className="w-full sm:w-auto min-w-[120px] border-[#3b6dae]/40 text-[#3b6dae] dark:text-blue-300 dark:border-[#3b6dae]/40 hover:bg-blue-50 dark:hover:bg-[#1f426b] font-semibold text-xs"
              >
                {rejectMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
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
              <Button variant="outline" onClick={() => setShowFilesDialog(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Full Form - Display as proper modal matching Request Form size and styling */}
        <Dialog open={showFullFormDialog} onOpenChange={setShowFullFormDialog}>
          <DialogContent
            className="w-full! h-dvh! md:h-auto! md:w-[70vw]! max-w-225! md:max-h-[90vh]! overflow-y-auto! p-0! flex! flex-col! gap-0! rounded-none! md:rounded-lg!"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>View Approval Request</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto w-full">
              {selectedRequest ? (
                <>
                  {/* ===== LEAVE REQUEST ===== */}
                  {selectedRequest.type === "leave" && (() => {
                    const leaveType = selectedRequest.leaveRequest?.leaveType;
                    const commonProps = {
                      isApprover: true as const,
                      requestData: selectedRequest,
                      onApprove: (data: any) => handleGenericApprove(data, "leave", getFormDataDynamic, storeFormData),
                      onReject: (reason: string) => {
                        setIsProcessingApproval(true);
                        rejectMutation.mutate({
                          requestId: selectedRequest.id,
                          comments: reason,
                        });
                      },
                      isLoading: approveMutation.isPending || rejectMutation.isPending || isProcessingApproval,
                    };
                    if (leaveType === "sick") return <SickLeaveForm {...commonProps} />;
                    if (leaveType === "personal") return <PersonalLeaveForm {...commonProps} />;
                    if (leaveType === "unpaid") return <UnpaidLeaveForm {...commonProps} />;
                    if (leaveType === "annual") return <AnnualLeaveForm {...commonProps} />;
                    return <LeaveRequestForm {...commonProps} />;
                  })()}

                  {/* ===== CAR REQUEST ===== */}
                  {selectedRequest.type === "car" && (
                    <CarRequestApprovalView
                      requestData={selectedRequest}
                      onApprove={(data) => handleGenericApprove(data, "car", getCarFormDataDynamic, storeCarFormData)}
                      onReject={(reason) => {
                        setIsProcessingApproval(true);
                        rejectMutation.mutate({
                          requestId: selectedRequest.id,
                          comments: reason,
                        });
                      }}
                      isLoading={approveMutation.isPending || rejectMutation.isPending || isProcessingApproval}
                    />
                  )}

                  {/* ===== EXPENDITURE REQUEST ===== */}
                  {selectedRequest.type === "expenditure" && (
                    <ExpenditureRequestApprovalView
                      requestData={selectedRequest}
                      onApprove={(data) => handleGenericApprove(data, "expenditure", getExpenditureFormDataDynamic, storeExpenditureFormData)}
                      onReject={(reason) => {
                        setIsProcessingApproval(true);
                        rejectMutation.mutate({
                          requestId: selectedRequest.id,
                          comments: reason,
                        });
                      }}
                      isLoading={approveMutation.isPending || rejectMutation.isPending || isProcessingApproval}
                    />
                  )}

                  {/* ===== ASSET REQUEST ===== */}
                  {selectedRequest.type === "asset" && (
                    <AssetRequestApprovalView
                      requestData={selectedRequest}
                      onApprove={(data) => handleGenericApprove(data, "asset", getAssetFormDataDynamic, storeAssetFormData)}
                      onReject={(reason) => {
                        setIsProcessingApproval(true);
                        rejectMutation.mutate({
                          requestId: selectedRequest.id,
                          comments: reason,
                        });
                      }}
                      isLoading={approveMutation.isPending || rejectMutation.isPending || isProcessingApproval}
                    />
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-blue-400 mr-2" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
