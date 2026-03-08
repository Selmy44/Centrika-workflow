"use client";

import { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SingleDatePicker from "@/components/SingleDatePicker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface CarRequestFormProps {
  onSuccess: () => void;
  onClose?: () => void;
  onBack?: () => void;
}

export default function CarRequestForm({ onSuccess, onClose, onBack }: CarRequestFormProps) {
  const { user, isAuthenticated } = useAuth();
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    destination: "",
    purpose: "",
    departureDate: "",
    departureTime: "",
    passengers: "1",
    driverName: "",
    carInfo: "",
    department: "",
    employeeName: "",
    dateOfEmployment: "",
    staffId: "",
    position: "",
  });

  const { data: drivers = [] } = trpc.requests.getAvailableDrivers.useQuery(undefined, {
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });

  const createCar = trpc.requests.createCarRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();

  useEffect(() => {
    if (user && autoFillData) {
      setForm((prev) => ({
        ...prev,
        employeeName: user.name || "",
        staffId: user.staffId || "",
        department: user.department || "",
        position: user.position || "",
        dateOfEmployment: autoFillData.dateOfEmployment || "",
      }));
    }
  }, [user, autoFillData]);

  const validate = () => {
    if (!form.driverName) {
      toast.error("Please select a driver and vehicle");
      return false;
    }
    if (!form.destination.trim()) {
      toast.error("Destination is required");
      return false;
    }
    if (!form.departureDate) {
      toast.error("Departure date is required");
      return false;
    }
    if (!form.departureTime) {
      toast.error("Departure time is required");
      return false;
    }
    const passengerCount = parseInt(form.passengers);
    if (isNaN(passengerCount) || passengerCount < 1 || passengerCount > 10) {
      toast.error("Passengers must be between 1 and 10");
      return false;
    }
    return true;
  };

  const handleSubmit = async (submit: boolean) => {
    if (submit && !validate()) return;

    setIsSubmitting(true);
    try {
      const request = await createCar.mutateAsync({
        title: form.title || `Car Request to ${form.destination}`,
        destination: form.destination,
        purpose: form.purpose,
        departureDate: form.departureDate,
        departureTime: form.departureTime,
        passengers: parseInt(form.passengers),
        driverName: form.driverName,
        carInfo: form.carInfo,
      });

      if (submit) {
        // Car requests auto-route to HR — no initialApproverId needed
        await submitRequest.mutateAsync({ id: request.id });
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

  if (!isAuthenticated) return null;

  return (
    <div className="w-full bg-white text-black px-10 leave-form-container relative">

      {/* CLOSE/BACK BUTTON */}
      <button
        onClick={() => onBack ? onBack() : (onClose ? onClose() : onSuccess())}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
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
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-xs">Department</p>
            <div className="flex gap-0 items-center">
              <span className="text-blue-600 font-bold text-xs whitespace-nowrap">CTK - </span>
              <Input
                value={form.department}
                className="w-full h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed border-l-0"
                disabled
              />
            </div>
          </div>
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-xs">Date of Request</p>
            <Input
              type="text"
              value={new Date().toISOString().split('T')[0]}
              className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Staff ID</p>
            <Input
              value={form.staffId}
              className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
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
          <Section title="1. EMPLOYEE INFORMATION">
            <Row label="1.1 Employee Full Name">
              <Input
                value={form.employeeName}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="1.2 Date of Employment">
              <Input
                type="date"
                value={form.dateOfEmployment}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="1.3 Staff ID">
              <Input
                value={form.staffId}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="1.4 Department">
              <Input
                value={form.department}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="1.5 Position / Title">
              <Input
                value={form.position}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
          </Section>

          {/* 2. CAR REQUEST DETAILS */}
          <Section title="2. CAR REQUEST DETAILS">
            <Row label="2.1 Destination">
              <Input
                placeholder="e.g., Kigali Downtown, Airport"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                className="border-blue-300 h-7 text-xs"
              />
            </Row>
            <Row label="2.2 Request Title (Optional)">
              <Input
                placeholder="e.g., Client Meeting, Office Supply Run"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="border-blue-300 h-7 text-xs"
              />
            </Row>
            <Row label="2.3 Purpose (Optional)">
              <Textarea
                placeholder="Describe the purpose of the trip..."
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="min-h-20 border-blue-300 text-xs"
              />
            </Row>
          </Section>

          {/* 3. TRIP DETAILS */}
          <Section title="3. TRIP DETAILS">
            <Row label="3.1 Departure Date">
              <SingleDatePicker
                value={form.departureDate}
                onChange={(date) => setForm({ ...form, departureDate: date })}
                label=""
              />
            </Row>
            <Row label="3.2 Departure Time">
              <Input
                type="time"
                value={form.departureTime}
                onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                className="border-blue-300 h-7 text-xs"
              />
            </Row>
            <Row label="3.3 Number of Passengers">
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={form.passengers}
                  onChange={(e) => setForm({ ...form, passengers: e.target.value })}
                  className="border-blue-300 h-7 text-xs"
                />
                <span className="text-sm font-medium text-gray-600">Person(s)</span>
              </div>
            </Row>
          </Section>

          {/* 4. DRIVER & VEHICLE */}
          <Section title="4. DRIVER & VEHICLE">
            <Row label="4.1 Select Driver & Car">
              <Select
                value={form.driverName}
                onValueChange={(v) => {
                  const driver = drivers.find((d: any) => d.name === v);
                  setForm({ ...form, driverName: v, carInfo: driver?.car || "" });
                }}
              >
                <SelectTrigger className="w-full h-10 border-blue-300 bg-white text-black font-medium focus:ring-blue-500">
                  <SelectValue placeholder="-- Select a Driver --" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  {drivers.map((driver: any) => (
                    <SelectItem key={driver.name} value={driver.name} className="focus:bg-blue-500 focus:text-white">
                      {driver.name} — {driver.car}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
            {form.carInfo && (
              <Row label="4.2 Assigned Vehicle">
                <Input
                  value={form.carInfo}
                  className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                  disabled
                />
              </Row>
            )}
          </Section>
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-blue-400 bg-gray-50 gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => window.print()}
              className="border-blue-400 text-blue-600"
            >
              <Printer size={16} className="mr-1" /> Print
            </Button>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                toast.info("Download functionality requires backend PDF generation");
              }}
              className="border-blue-400 text-blue-600"
            >
              <Download size={16} className="mr-1" /> Download
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="border-blue-400"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Draft
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="text-center text-xs text-gray-600 py-3 border-t border-gray-200 space-y-1">
          <p>www.centrika.rw</p>
          <p>1 | Centrika Ltd | Motto: Delivering Tomorrow's Solutions Today</p>
        </div>
      </div>
    </div>
  );
}

/* ========= Helper Components ========= */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-blue-400">
      <div className="bg-blue-500 text-white font-bold px-4 py-2 text-sm">{title}</div>
      {children}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[220px_1fr] border-b border-blue-400">
      <div className="px-3 py-2 font-medium border-r border-blue-400 bg-blue-100 text-blue-700 text-xs">
        {label}
      </div>
      <div className="px-3 py-1">{children}</div>
    </div>
  );
}
