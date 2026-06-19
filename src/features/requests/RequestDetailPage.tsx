import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2 } from "lucide-react";
import { useParams, useLocation } from "wouter";
import LeaveRequestForm from "@/components/forms/LeaveRequestForm";
import AssetRequestForm from "@/components/forms/AssetRequestForm";
import CarRequestForm from "@/components/forms/CarRequestForm";
import ExpenditureRequestForm from "@/components/forms/ExpenditureRequestForm";
import PersonalLeaveForm from "@/components/forms/PersonalLeaveForm";
import UnpaidLeaveForm from "@/components/forms/UnpaidLeaveForm";
import SickLeaveForm from "@/components/forms/SickLeaveForm";
import AnnualLeaveForm from "@/components/forms/AnnualLeaveForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

export default function RequestDetail() {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const [, navigate] = useLocation();
  const requestId = params.id ? parseInt(params.id) : 0;
  const [requestData, setRequestData] = useState<any>(null);
  const [showModal, setShowModal] = useState(true);
  const queryClient = useQueryClient();

  const { data: allRequests = [], isLoading } = trpc.requests.listUserRequests.useQuery({ includeNonSubmitted: true }, {
    enabled: isAuthenticated && requestId > 0,
    staleTime: 5 * 60 * 1000,       // Serve from cache for 5 min — no blank flash on re-navigation
    gcTime: 10 * 60 * 1000,         // Keep in memory for 10 min
    refetchOnWindowFocus: false,    // Don't re-fetch just because user switched tabs
  });

  // Add a direct query for the specific request to ensure we always have latest data
  const { data: specificRequest, refetch: refetchSpecificRequest } = trpc.requests.getRequest.useQuery(
    { id: requestId },
    {
      enabled: isAuthenticated && requestId > 0,
      staleTime: 3 * 60 * 1000,     // Fresh for 3 min — fast load, still re-validates
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Auto-mark related notifications as read when form is opened
  const markReadByRequestId = (trpc as any).notifications.markReadByRequestId.useMutation();
  const notifMarkedRef = useRef(false);

  // Find the specific request from the list
  useEffect(() => {
    if (specificRequest) {
      // Use the specific request query which always has fresh data
      setRequestData(specificRequest);
      // Mark any related notifications as read (only once)
      if (!notifMarkedRef.current) {
        notifMarkedRef.current = true;
        markReadByRequestId.mutate({ requestId: specificRequest.id });
      }
    } else if (allRequests && allRequests.length > 0) {
      // Fallback to list if specific query hasn't loaded
      const found = allRequests.find((r: any) => r.id === requestId);
      setRequestData(found || null);
    }
  }, [specificRequest, allRequests, requestId]);

  if (!isAuthenticated) {
    return null;
  }

  const notFound = !isLoading && !requestData;

  const handleFormSuccess = () => {
    // Invalidate all request-related queries to get fresh data
    refetchSpecificRequest();
    queryClient.invalidateQueries({ queryKey: ["requests", "listUserRequests"] });
    // Close modal and redirect after success
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Redirect back to requests list
    setTimeout(() => navigate("/requests"), 300);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout hideConnectDock={true}>
      <div className="p-4 lg:p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        )}

        {notFound && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Request not found</p>
          </div>
        )}

        {/* Form Modal */}
        {requestData && (
          <Dialog open={showModal} onOpenChange={handleCloseModal}>
            <DialogContent
              className="w-full! h-dvh! lg:h-auto! lg:w-[70vw]! max-w-225! lg:max-h-[90vh]! overflow-y-auto! p-0! flex! flex-col! gap-0! rounded-none! lg:rounded-lg!"
            >
              <DialogHeader className="sr-only">
                <DialogTitle>View Request</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto w-full">
                {requestData.type === "leave" && (
                  <>
                    {requestData.leaveRequest?.leaveType === "personal" && (
                      <PersonalLeaveForm
                        requestData={requestData}
                        isReadOnly={requestData.status !== "draft"}
                        onSuccess={handleFormSuccess}
                      />
                    )}
                    {requestData.leaveRequest?.leaveType === "sick" && (
                      <SickLeaveForm
                        requestData={requestData}
                        isReadOnly={requestData.status !== "draft"}
                        onSuccess={handleFormSuccess}
                      />
                    )}
                    {requestData.leaveRequest?.leaveType === "unpaid" && (
                      <UnpaidLeaveForm
                        requestData={requestData}
                        isReadOnly={requestData.status !== "draft"}
                        onSuccess={handleFormSuccess}
                      />
                    )}
                    {requestData.leaveRequest?.leaveType === "annual" && (
                      <AnnualLeaveForm
                        requestData={requestData}
                        isReadOnly={requestData.status !== "draft"}
                        onSuccess={handleFormSuccess}
                      />
                    )}
                    {requestData.leaveRequest?.leaveType !== "personal" &&
                     requestData.leaveRequest?.leaveType !== "sick" &&
                     requestData.leaveRequest?.leaveType !== "unpaid" &&
                     requestData.leaveRequest?.leaveType !== "annual" && (
                      <LeaveRequestForm
                        requestData={requestData}
                        isReadOnly={requestData.status !== "draft"}
                        onSuccess={handleFormSuccess}
                      />
                    )}
                  </>
                )}
                {requestData.type === "asset" && (
                  <AssetRequestForm
                    requestData={requestData}
                    isReadOnly={requestData.status !== "draft"}
                    onSuccess={handleFormSuccess}
                  />
                )}
                {requestData.type === "car" && (
                  <CarRequestForm
                    requestData={requestData}
                    isReadOnly={requestData.status !== "draft"}
                    onSuccess={handleFormSuccess}
                  />
                )}
                {requestData.type === "expenditure" && (
                  <ExpenditureRequestForm
                    requestData={requestData}
                    isReadOnly={requestData.status !== "draft"}
                    onSuccess={handleFormSuccess}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
