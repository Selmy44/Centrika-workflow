import { useAuth } from "@/_core/hooks/useAuth";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ExpenditureRequest() {
  const { isAuthenticated } = useAuth();
  const autoFill = useFormAutoFill();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    currency: "RWF",
    department: "",
    category: "",
    reportingManager: "", // Department head ID
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: departmentHeads = [] } = trpc.users.listHeads.useQuery();
  
  const uniqueHeads = Array.from(
    new Map(departmentHeads.map((h: any) => [h.id, h])).values()
  );

  const createExpenditureRequest = trpc.requests.createExpenditureRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reportingManager) {
      toast.error("Please select a department head");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create the request in draft status
      const createdRequest = await createExpenditureRequest.mutateAsync({
        title: formData.title || `Expenditure Request - ${formData.amount} ${formData.currency}`,
        amount: parseInt(formData.amount) || 0,
        currency: formData.currency,
        department: formData.department,
        category: formData.category,
      });

      // Step 2: Submit the request with the selected department head
      await submitRequest.mutateAsync({
        id: createdRequest.id,
        initialApproverId: parseInt(formData.reportingManager),
      });

      toast.success("Expenditure request submitted successfully!");
      navigate("/requests");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
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
          <h1 className="text-3xl font-bold text-foreground">Expenditure Request</h1>
          <p className="text-muted-foreground mt-2">Request expense reimbursement</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Fill in the details for your expenditure request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-foreground">
                  Department
                </Label>
                <Input
                  id="department"
                  type="text"
                  value={autoFill.department}
                  readOnly
                  className="bg-muted border-border text-foreground cursor-not-allowed"
                />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position" className="text-foreground">
                  Position
                </Label>
                <Input
                  id="position"
                  type="text"
                  value={autoFill.position}
                  readOnly
                  className="bg-muted border-border text-foreground cursor-not-allowed"
                />
              </div>

              {/* Staff ID */}
              <div className="space-y-2">
                <Label htmlFor="staffId" className="text-foreground">
                  Staff ID
                </Label>
                <Input
                  id="staffId"
                  type="text"
                  value={autoFill.staffId}
                  readOnly
                  className="bg-muted border-border text-foreground cursor-not-allowed"
                />
              </div>

              {/* Employment Date */}
              <div className="space-y-2">
                <Label htmlFor="employmentDate" className="text-foreground">
                  Employment Date
                </Label>
                <Input
                  id="employmentDate"
                  type="text"
                  value={autoFill.dateOfEmployment}
                  readOnly
                  className="bg-muted border-border text-foreground cursor-not-allowed"
                />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">
                  Description
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What is this expense for?"
                  className="bg-input border-border text-foreground"
                />
              </div>

              {/* Amount and Currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-foreground">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                    className="bg-input border-border text-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-foreground">
                    Currency
                  </Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger id="currency" className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="RWF">RWF (Rwandan Franc)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reporting Manager / Department Head */}
              <div className="space-y-2">
                <Label htmlFor="reportingManager" className="text-foreground">
                  Reporting Manager (Department Head) *
                </Label>
                <Select value={formData.reportingManager} onValueChange={(value) => setFormData({ ...formData, reportingManager: value })}>
                  <SelectTrigger id="reportingManager" className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select your department head" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {uniqueHeads.map((head) => (
                      <SelectItem key={head.id} value={head.id.toString()}>
                        {head.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-foreground">
                  Department (Optional)
                </Label>
                <Input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Which department?"
                  className="bg-input border-border text-foreground"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground">
                  Category (Optional)
                </Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category" className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="meals">Meals</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.amount || !formData.reportingManager}
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
