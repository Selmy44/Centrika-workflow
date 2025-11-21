import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CarRequest() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    purpose: "",
    departureDate: "",
    departureTime: "",
    passengers: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCarRequest = trpc.requests.createCarRequest.useMutation({
    onSuccess: () => {
      toast.success("Car request submitted successfully!");
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
      await createCarRequest.mutateAsync({
        title: formData.title || `Car Request to ${formData.destination}`,
        destination: formData.destination,
        purpose: formData.purpose,
        departureDate: formData.departureDate,
        departureTime: formData.departureTime,
        passengers: formData.passengers,
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
                  disabled={isSubmitting || !formData.destination || !formData.departureDate}
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
