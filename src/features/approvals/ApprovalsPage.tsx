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
import { SignaturePad } from "@/components/SignaturePad";
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
import { Loader2, FileText, Car, DollarSign, CheckCircle, XCircle, Clock, Eye, Package, Search } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<"upload" | "draw">("draw");

  const { data: pendingRequests, isLoading: pendingLoading, refetch } = (trpc as any).requests.listPendingApprovals.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role !== "user" || !!user?.additionalRoles),
  });

  const { data: historyRequests, isLoading: historyLoading, refetch: refetchHistory } = (trpc as any).requests.listApprovalHistory.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role !== "user" || !!user?.additionalRoles),
  });

  const isLoading = pendingLoading || historyLoading;

  // Combine and deduplicate: pending from listPendingApprovals + history from listApprovalHistory
  const allRequests = (() => {
    const map = new Map<number, any>();
    (pendingRequests || []).forEach((r: any) => map.set(r.id, r));
    (historyRequests || []).forEach((r: any) => { if (!map.has(r.id)) map.set(r.id, r); });
    return Array.from(map.values()).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  })();

  // Filter by tab
  const tabFilteredRequests = activeTab === "all" ? allRequests
    : allRequests.filter((r: any) => r.status === activeTab);

  // Then apply search filter
  const filteredRequests = tabFilteredRequests.filter((request: any) =>
    request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.userId?.toString().includes(searchTerm)
  );

  // Tab counts
  const tabCounts = {
    all: allRequests.length,
    pending: allRequests.filter((r: any) => r.status === "pending").length,
    approved: allRequests.filter((r: any) => r.status === "approved").length,
    rejected: allRequests.filter((r: any) => r.status === "rejected").length,
  };

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
      setIsProcessingApproval(false);
      // Refresh the list to remove the approved request
      refetch();
      refetchHistory();
      // Invalidate dashboard stats so counts update in real-time
      queryClient.invalidateQueries({ queryKey: ["requests", "getDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["requests", "getRecentRequests"] });
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
      setComments("");
      setSelectedRequest(null);
      refetch();
      refetchHistory();
      // Invalidate dashboard stats so counts update in real-time
      queryClient.invalidateQueries({ queryKey: ["requests", "getDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["requests", "getRecentRequests"] });
    },
    onError: (error: any) => {
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
        if (type === "leave") signatureUpdate.approverSignatureUrl = signatureDataUrl;
        
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

          {/* Premium animated search bar on the right */}
          {!isLoading && allRequests.length > 0 && (
          <div className="relative group transition-all duration-300 z-10 w-full lg:w-64 shrink-0 focus-within:w-full lg:focus-within:w-80">
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
          )}
        </div>

        {/* Status filter tabs */}
        <div className="overflow-x-auto border-b border-border pb-0 -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex gap-2 min-w-max">
          {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
              }`}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
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
                <p className="text-muted-foreground">No requests match your search or filter</p>
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
                <div className="mt-4">
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        checked={signatureMethod === "draw"}
                        onChange={() => {
                          setSignatureMethod("draw");
                          setSignatureFile(null);
                          setApproverSignatureUrl("");
                        }}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Draw Signature</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        checked={signatureMethod === "upload"}
                        onChange={() => {
                          setSignatureMethod("upload");
                          setSignatureFile(null);
                          setApproverSignatureUrl("");
                        }}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Upload Image</span>
                    </label>
                  </div>

                  {signatureMethod === "upload" ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSignatureFile(file);
                          if (file) {
                             const reader = new FileReader();
                             reader.onload = (ev) => setApproverSignatureUrl(ev.target?.result as string);
                             reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-xs"
                      />
                      {signatureFile && (
                        <p className="text-xs text-muted-foreground mt-2 font-semibold">Selected: {signatureFile.name}</p>
                      )}
                    </div>
                  ) : (
                    <SignaturePad 
                      onSave={(dataUrl) => {
                        const file = base64ToFile(dataUrl, "approver_signature.png");
                        setSignatureFile(file);
                        setApproverSignatureUrl(dataUrl);
                      }}
                      onClear={() => {
                        setSignatureFile(null);
                        setApproverSignatureUrl("");
                      }}
                    />
                  )}
                  
                  {approverSignatureUrl && signatureMethod === "upload" && (
                    <div className="mt-2 animate-in zoom-in duration-300">
                       <img src={approverSignatureUrl} alt="sig" className="h-16 object-contain rounded-lg p-1 bg-white" />
                    </div>
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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-none sm:rounded-lg shadow-2xl w-full max-w-7xl h-dvh sm:h-[95vh] flex flex-col relative">
              {/* Navbar Header - Fixed at top */}
              <div className="flex items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
                <h2 className="text-sm sm:text-lg font-semibold text-foreground truncate">
                  {selectedRequest?.title}
                </h2>
                <button
                  onClick={() => setShowFullFormDialog(false)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold text-xl sm:text-2xl w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0"
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
                        onApprove={(data) => handleGenericApprove(data, "leave", getFormDataDynamic, storeFormData)}
                        onReject={(reason) => {
                          rejectMutation.mutate({
                            requestId: selectedRequest.id,
                            comments: reason,
                          });
                          setShowFullFormDialog(false);
                        }}
                        isLoading={approveMutation.isPending || rejectMutation.isPending || isProcessingApproval}
                      />
                    )}

                    {/* ===== CAR REQUEST ===== */}
                    {selectedRequest.type === "car" && (
                      <CarRequestApprovalView
                        requestData={selectedRequest}
                        onApprove={(data) => handleGenericApprove(data, "car", getCarFormDataDynamic, storeCarFormData)}
                        onReject={(reason) => {
                          rejectMutation.mutate({
                            requestId: selectedRequest.id,
                            comments: reason,
                          });
                          setShowFullFormDialog(false);
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
                          rejectMutation.mutate({
                            requestId: selectedRequest.id,
                            comments: reason,
                          });
                          setShowFullFormDialog(false);
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
                          rejectMutation.mutate({
                            requestId: selectedRequest.id,
                            comments: reason,
                          });
                          setShowFullFormDialog(false);
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
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
