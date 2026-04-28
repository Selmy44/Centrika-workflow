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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
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
  });

  // Add a direct query for the specific request to ensure we always have latest data
  const { data: specificRequest, refetch: refetchSpecificRequest } = trpc.requests.getRequest.useQuery(
    { id: requestId },
    { enabled: isAuthenticated && requestId > 0 }
  );

  // Find the specific request from the list
  useEffect(() => {
    if (specificRequest) {
      // Use the specific request query which always has fresh data
      setRequestData(specificRequest);
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
      <div className="p-4 md:p-6">
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
              className="w-full! h-dvh! md:h-auto! md:w-[70vw]! max-w-225! md:max-h-[90vh]! overflow-y-auto! p-0! flex! flex-col! gap-0! rounded-none! md:rounded-lg!"
            >
              <DialogHeader className="sr-only">
                <DialogTitle>View Request</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto w-full">
                {requestData.type === "leave" && (
                  <LeaveRequestForm
                    requestData={requestData}
                    isReadOnly={requestData.status !== "draft"}
                    onSuccess={handleFormSuccess}
                  />
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
                {requestData.type === "personal" && (
                  <PersonalLeaveForm
                    requestData={requestData}
                    isReadOnly={requestData.status !== "draft"}
                    onSuccess={handleFormSuccess}
                  />
                )}
                {requestData.type === "unpaid" && (
                  <UnpaidLeaveForm
                    requestData={requestData}
                    isReadOnly={requestData.status !== "draft"}
                    onSuccess={handleFormSuccess}
                  />
                )}
                {requestData.type === "sick" && (
                  <SickLeaveForm
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
