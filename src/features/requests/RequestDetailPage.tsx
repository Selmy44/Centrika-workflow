import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import { RequestMessaging } from "@/components/RequestMessaging";
import { WorkflowTracker } from "@/components/WorkflowTracker";
import LeaveRequestForm from "@/components/forms/LeaveRequestForm";
import AssetRequestForm from "@/components/forms/AssetRequestForm";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export default function RequestDetail() {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const requestId = params.id ? parseInt(params.id) : 0;
  const [requestData, setRequestData] = useState<any>(null);

  const { data: allRequests = [], isLoading } = trpc.requests.listUserRequests.useQuery(undefined, {
    enabled: isAuthenticated && requestId > 0,
  });

  // Find the specific request from the list
  useEffect(() => {
    if (allRequests && allRequests.length > 0) {
      const found = allRequests.find((r: any) => r.id === requestId);
      setRequestData(found || null);
    }
  }, [allRequests, requestId]);

  if (!isAuthenticated) {
    return null;
  }

  const notFound = !isLoading && !requestData;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/requests">
            <Button variant="outline" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#3b6dae] dark:text-[#c79d2d]">View Request</h1>
            <p className="text-muted-foreground mt-1">Request Form</p>
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
        ) : notFound ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Request not found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Workflow Tracker */}
            <WorkflowTracker 
              currentStatus={requestData.status} 
              approvalLogs={requestData.approvalLogs || []} 
            />

            {requestData.type === "leave" && (
              <LeaveRequestForm
                requestData={requestData}
                isReadOnly={true}
              />
            )}
            {requestData.type === "asset" && (
              <AssetRequestForm
                requestData={requestData}
                isReadOnly={true}
              />
            )}

            {/* Discussion Thread */}
            <RequestMessaging requestId={requestId} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
