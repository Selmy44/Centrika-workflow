import { useAuth } from "@/_core/hooks/useAuth";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CarRequest() {
  const { isAuthenticated } = useAuth();
  const autoFill = useFormAutoFill();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    purpose: "",
    departureDate: "",
    departureTime: "",
    passengers: 1,
    reportingManager: "", // New field for department head ID
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: departmentHeads } = (trpc as any).employees.getDepartmentHeads.useQuery();

  const createCarRequest = (trpc as any).requests.createCarRequest.useMutation();
  const submitRequest = (trpc as any).requests.submitRequest.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reportingManager) {
      toast.error("Please select a department head");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create the request in draft status
      const createdRequest = await createCarRequest.mutateAsync({
        title: formData.title || `Car Request to ${formData.destination}`,
        destination: formData.destination,
        purpose: formData.purpose,
        departureDate: formData.departureDate,
        departureTime: formData.departureTime,
        passengers: formData.passengers,
      });

      // Step 2: Submit the request with the selected department head
      await submitRequest.mutateAsync({
        id: createdRequest.id,
        initialApproverId: parseInt(formData.reportingManager),
      });

      toast.success("Car request submitted successfully!");
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
          <h1 className="text-3xl font-bold text-foreground">Car Request</h1>
          <p className="text-muted-foreground mt-2">Book a company vehicle</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Fill in the details for your car request</CardDescription>
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
                    {departmentHeads?.map((head: any) => (
                      <SelectItem key={head.id} value={head.id.toString()}>
                        {head.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-foreground">
                  Destination
                </Label>
                <Input
                  id="destination"
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Where are you going?"
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label htmlFor="purpose" className="text-foreground">
                  Purpose (Optional)
                </Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="What is the purpose of this trip?"
                  className="bg-input border-border text-foreground min-h-24"
                />
              </div>

              {/* Departure Date */}
              <div className="space-y-2">
                <Label htmlFor="departureDate" className="text-foreground">
                  Departure Date
                </Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>

              {/* Departure Time */}
              <div className="space-y-2">
                <Label htmlFor="departureTime" className="text-foreground">
                  Departure Time (Optional)
                </Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                  className="bg-input border-border text-foreground"
                />
              </div>

              {/* Number of Passengers */}
              <div className="space-y-2">
                <Label htmlFor="passengers" className="text-foreground">
                  Number of Passengers
                </Label>
                <Input
                  id="passengers"
                  type="number"
                  min="1"
                  value={formData.passengers}
                  onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) || 1 })}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.destination || !formData.departureDate || !formData.reportingManager}
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
