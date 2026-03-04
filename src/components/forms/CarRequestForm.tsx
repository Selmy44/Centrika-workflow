"use client";

import { useState, useEffect } from "react";
import { format, isAfter } from "date-fns";
import { CalendarIcon, Loader2, Phone, Mail, Globe, MapPin } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface CarRequestFormProps {
  onSuccess: () => void; // close modal after success
}

export default function CarRequestForm({ onSuccess }: CarRequestFormProps) {
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    destination: "",
    purpose: "",
    departureDate: undefined as Date | undefined,
    departureTime: "",
    passengers: "1",
    reportingManager: "",
    department: autoFillData.department || "",
    employeeName: autoFillData.name || "",
    dateOfEmployment: autoFillData.dateOfEmployment || "",
    staffId: autoFillData.staffId || "",
    position: autoFillData.position || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: heads = [] } = trpc.users.listHeads.useQuery();
  
  const uniqueHeads = Array.from(
    new Map(heads.map(h => [h.id, h])).values()
  );
  const createCar = trpc.requests.createCarRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();

  useEffect(() => {
    if (autoFillData.managerId) {
      setForm(prev => ({
        ...prev,
        reportingManager: String(autoFillData.managerId),
      }));
    }
  }, [autoFillData.managerId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.reportingManager) {
      newErrors.reportingManager = "Please select a reporting manager";
    }
    if (!form.destination.trim()) {
      newErrors.destination = "Destination is required";
    }
    if (!form.departureDate) {
      newErrors.departureDate = "Departure date is required";
    }
    if (!form.departureTime) {
      newErrors.departureTime = "Departure time is required";
    }
    const passengerCount = parseInt(form.passengers);
    if (isNaN(passengerCount) || passengerCount < 1 || passengerCount > 10) {
      newErrors.passengers = "Passengers must be between 1 and 10";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (submit: boolean) => {
    if (!validate()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const request = await createCar.mutateAsync({
        title: form.title || `Car Request to ${form.destination}`,
        destination: form.destination,
        purpose: form.purpose,
        departureDate: format(form.departureDate!, "yyyy-MM-dd"),
        departureTime: form.departureTime,
        passengers: parseInt(form.passengers),
      });

      if (submit) {
        await submitRequest.mutateAsync({
          id: request.id,
          initialApproverId: Number(form.reportingManager),
        });
      }

      toast.success(
        submit ? "Car request submitted successfully" : "Draft saved"
      );
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border bg-card relative">
      {/* CLOSE/BACK BUTTON */}
      <button
        onClick={() => onSuccess()}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition z-10"
        title="Close form"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div>
      
      {/* ===== HEADER WITH LOGO AND CONTACT INFO ===== */}
      <div className="flex justify-between items-start px-8 py-6 gap-12">
        {/* LEFT: LOGO */}
        <div className="shrink-0">
          <img 
            src="/logo/centrikaLogo.png" 
            alt="Centrika Logo" 
            className="h-32 w-auto"
          />
        </div>

        {/* RIGHT: CONTACT INFO WITH ICONS - STACKED VERTICALLY */}
        <div className="text-sm flex-1 flex justify-end">
          <div className="flex flex-col gap-3 items-start">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-blue-600" />
              <span className="text-blue-600 font-semibold">+250 788 123 099</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-blue-600" />
              <span className="text-blue-600 font-semibold">info@centrika.rw</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-blue-600" />
              <span className="text-blue-600 font-semibold">www.centrika.rw</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-blue-600 font-semibold">Room F002, 2nd Floor, CHIC Building,</span>
                <span className="text-blue-600 font-semibold">Plot 1007, KN2 Kigali-Rwanda</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TITLE BAR (YELLOW) ===== */}
      <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide">
        CAR REQUEST FORM
      </div>

      {/* ===== REQUEST HEADER SECTION ===== */}
      <div className="grid grid-cols-4 gap-3 px-6 py-3 text-sm items-end">
        {/* Department */}
        <div>
          <p className="font-semibold text-blue-600 mb-1 text-xs">Department</p>
          <Input
            value={form.department}
            className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
            disabled
          />
        </div>

        {/* Date of Request */}
        <div>
          <p className="font-semibold text-blue-600 mb-1 text-xs">Date of Request</p>
          <Input 
            type="text"
            value={format(new Date(), "yyyy-MM-dd")}
            className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed" 
            disabled
          />
        </div>

        {/* Staff ID */}
        <div>
          <p className="font-semibold text-blue-600 text-xs mb-1">Staff ID</p>
          <Input 
            value={form.staffId}
            className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed" 
            disabled
          />
        </div>

        {/* Employee Name */}
        <div>
          <p className="font-semibold text-blue-600 text-xs mb-1">Employee Name</p>
          <Input 
            value={form.employeeName}
            className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed" 
            disabled
          />
        </div>
      </div>

      {/* ===== REQUEST DETAILS ===== */}
      <div className="border-t border-blue-400">
        <div className="bg-blue-600 text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>
        
        {/* 1. EMPLOYEE INFORMATION */}
        <div className="px-6 py-4">
          <h3 className="font-semibold text-blue-600 mb-3">1. EMPLOYEE INFORMATION</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-blue-600">Employee Name</Label>
              <Input
                value={form.employeeName}
                className="h-7 border-blue-300 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </div>

            <div>
              <Label className="text-xs text-blue-600">Staff ID</Label>
              <Input
                value={form.staffId}
                className="h-7 border-blue-300 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </div>

            <div>
              <Label className="text-xs text-blue-600">Department</Label>
              <Input
                value={form.department}
                className="h-7 border-blue-300 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </div>

            <div>
              <Label className="text-xs text-blue-600">Position</Label>
              <Input
                value={form.position}
                className="h-7 border-blue-300 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </div>
          </div>
        </div>
      </div>













      

      {/* ===== CAR REQUEST DETAILS ===== */}
      <CardContent className="space-y-8">
        {/* REQUEST DETAILS */}
        <section className="space-y-4">
          <h4 className="font-semibold text-primary">
            2. REQUEST DETAILS
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportingManager">Reporting Manager *</Label>
              <Select
                value={form.reportingManager}
                onValueChange={(v) =>
                  setForm({ ...form, reportingManager: v })
                }
              >
                <SelectTrigger id="reportingManager">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueHeads.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.reportingManager && (
                <p className="text-xs text-destructive mt-1">{errors.reportingManager}</p>
              )}
            </div>

            <div>
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                placeholder="e.g., Kigali Downtown, Airport"
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
                className={errors.destination ? "border-destructive" : ""}
              />
              {errors.destination && (
                <p className="text-xs text-destructive mt-1">{errors.destination}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Client Meeting, Office Supply Run"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />
          </div>
        </section>

        {/* TRIP DETAILS */}
        <section className="space-y-4">
          <h4 className="font-semibold text-primary">
            Trip Details
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Departure Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start",
                      !form.departureDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.departureDate
                      ? format(form.departureDate, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start">
                  <Calendar
                    mode="single"
                    selected={form.departureDate}
                    onSelect={(date) =>
                      setForm({ ...form, departureDate: date })
                    }
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              {errors.departureDate && (
                <p className="text-xs text-destructive mt-1">{errors.departureDate}</p>
              )}
            </div>

            <div>
              <Label htmlFor="departureTime">Departure Time *</Label>
              <Input
                id="departureTime"
                type="time"
                value={form.departureTime}
                onChange={(e) =>
                  setForm({ ...form, departureTime: e.target.value })
                }
                className={errors.departureTime ? "border-destructive" : ""}
              />
              {errors.departureTime && (
                <p className="text-xs text-destructive mt-1">{errors.departureTime}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passengers">Number of Passengers *</Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                max="10"
                value={form.passengers}
                onChange={(e) =>
                  setForm({ ...form, passengers: e.target.value })
                }
                className={errors.passengers ? "border-destructive" : ""}
              />
              {errors.passengers && (
                <p className="text-xs text-destructive mt-1">{errors.passengers}</p>
              )}
            </div>
          </div>
        </section>

        {/* PURPOSE */}
        <section>
          <Label htmlFor="purpose">Purpose (Optional)</Label>
          <Textarea
            id="purpose"
            className="min-h-[120px]"
            placeholder="Describe the purpose of the trip..."
            value={form.purpose}
            onChange={(e) =>
              setForm({ ...form, purpose: e.target.value })
            }
          />
        </section>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
          >
            Save Draft
          </Button>

          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Request
          </Button>
        </div>
      </CardContent>
      </div>
    </Card>
  );
}
