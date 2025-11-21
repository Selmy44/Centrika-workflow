import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LeaveRequest() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    title: "",
    leaveType: "annual" as const,
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLeaveRequest = trpc.requests.createLeaveRequest.useMutation({
    onSuccess: () => {
      toast.success("Leave request submitted successfully!");
      navigate("/requests");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit request");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createLeaveRequest.mutateAsync({
        title: formData.title || `${formData.leaveType} Leave Request`,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leave Request</h1>
          <p className="text-muted-foreground mt-2">Submit a new leave request</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Fill in the details for your leave request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Leave Type */}
              <div className="space-y-2">
                <Label htmlFor="leaveType" className="text-foreground">
                  Leave Type
                </Label>
                <Select value={formData.leaveType} onValueChange={(value: any) => setFormData({ ...formData, leaveType: value })}>
                  <SelectTrigger id="leaveType" className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-foreground">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-foreground">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-foreground">
                  Reason (Optional)
                </Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Provide any additional details..."
                  className="bg-input border-border text-foreground min-h-32"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.startDate || !formData.endDate}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/requests")}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
