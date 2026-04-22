"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
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
import { SignaturePad } from "@/components/SignaturePad";
import { base64ToFile } from "@/lib/fileUtils";

interface CarRequestFormProps {
  requestData?: any;
  isReadOnly?: boolean;
  onSuccess: () => void;
}

export default function CarRequestForm({ requestData, isReadOnly = false, onSuccess }: CarRequestFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
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
    employeeSignatureUrl: "",
    signaturePreview: "",
    signatureFile: null as File | null,
    signatureMethod: "draw" as "upload" | "draw",
  });

  const { data: drivers = [] } = trpc.requests.getAvailableDrivers.useQuery(undefined, {
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });

  // Fetch saved form data for draft/read-only views
  const savedFormData = (trpc as any).requests.getCarFormData.useQuery(
    { requestId: requestData?.id || 0 },
    { enabled: !!requestData?.id && (isReadOnly || requestData?.status === "draft") }
  );

  const createCar = trpc.requests.createCarRequest.useMutation();
  const updateCar = (trpc as any).requests.updateCarRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();
  const storeFormData = trpc.requests.storeCarFormData.useMutation();

  // Merge saved form data when available
  useEffect(() => {
    if (savedFormData.data) {
      const d = savedFormData.data;
      setForm((prev: any) => ({
        ...prev,
        ...d, // Spread all saved data first
        // Then explicitly set file/signature fields that can't be serialized
        employeeSignatureUrl: d.employeeSignatureUrl || prev.employeeSignatureUrl,
        signatureFile: null, // Don't restore file objects
        signaturePreview: d.signaturePreview || prev.signaturePreview,
      }));
    }
  }, [savedFormData.data]);

  useEffect(() => {
    if (user && autoFillData) {
      setForm((prev) => ({
        ...prev,
        employeeName: user.name || "",
        staffId: user.staffId || "",
        department: user.department?.name || "",
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
    if (!form.employeeSignatureUrl) {
      toast.error("Please upload your signature");
      return false;
    }
    return true;
  };

  const handleSubmit = async (submit: boolean) => {
    if (submit && !validate()) return;

    setIsSubmitting(true);
    try {
      // Check if we're updating an existing draft request
      const isEditing = requestData?.id && requestData?.status === "draft";
      
      const payload = {
        title: form.title || `Car Request to ${form.destination}`,
        destination: form.destination,
        purpose: form.purpose,
        departureDate: form.departureDate,
        departureTime: form.departureTime,
        passengers: parseInt(form.passengers),
        driverName: form.driverName,
        carInfo: form.carInfo,
      };

      let requestId: number;
      if (isEditing) {
        // Update existing draft
        await updateCar.mutateAsync({
          requestId: requestData.id,
          ...payload,
        });
        requestId = requestData.id;
      } else {
        // Create new request
        const request = await createCar.mutateAsync(payload);
        requestId = request.id;
      }

      // Store form data for both draft and submitted forms
      await storeFormData.mutateAsync({
        requestId: requestId,
        formData: {
          ...form,
          signatureFile: undefined, // Non-serializable
        }
      });

      if (submit) {
        // Car requests auto-route to HR — no initialApproverId needed
        await submitRequest.mutateAsync({ id: requestId });
      }

      toast.success(
        submit ? "Car request submitted successfully" : "Draft saved"
      );
      onSuccess();
      
      // Redirect to My Requests if submitted
      if (submit) {
        setTimeout(() => {
          navigate("/requests");
        }, 500);
      }
      
      // Redirect to My Requests if submitted
      if (submit) {
        setTimeout(() => {
          navigate("/requests");
        }, 500);
      }
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="w-full bg-white dark:bg-[#1f426b] text-black dark:text-slate-100 px-4 leave-form-container relative dark:border-[#2b6cb0]/30">

      <div>
        {/* ===== HEADER WITH LOGO AND CONTACT INFO ===== */}
        <div className="flex justify-between items-start px-6 py-3 gap-8">
          {/* LEFT: LOGO */}
          <div className="shrink-0">
            <img
              src="/logo/centrikaLogo.png"
              alt="Centrika Logo"
              className="h-20 w-auto"
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

        {/* ===== REQUEST HEADER SECTION - Responsive Grid ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm items-end">
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-[10px] md:text-xs">Department</p>
            <div className="flex gap-0 items-center">
              <span className="text-blue-600 font-bold text-[10px] md:text-xs whitespace-nowrap">CTK - </span>
              <Input
                value={form.department}
                className="w-full h-6 md:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] md:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed border-l-0"
                disabled
              />
            </div>
          </div>
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-[10px] md:text-xs">Date of Request</p>
            <Input
              type="text"
              value={new Date().toISOString().split('T')[0]}
              className="h-6 md:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] md:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Staff ID</p>
            <Input
              value={form.staffId}
              className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Employee Name</p>
            <Input
              value={form.employeeName}
              className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        {/* ===== REQUEST DETAILS ===== */}
        <div className="border-t border-[#3b6dae]">
          <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

          {/* 1. EMPLOYEE INFORMATION */}
          <Section title="1. EMPLOYEE INFORMATION">
            <Row label="1.1 Employee Full Name">
              <Input
                value={form.employeeName}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.2 Date of Employment">
              <Input
                type="date"
                value={form.dateOfEmployment}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.3 Staff ID">
              <Input
                value={form.staffId}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.4 Department">
              <Input
                value={form.department}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.5 Position / Title">
              <Input
                value={form.position}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
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
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs"
              />
            </Row>
            <Row label="2.2 Request Title (Optional)">
              <Input
                placeholder="e.g., Client Meeting, Office Supply Run"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs"
              />
            </Row>
            <Row label="2.3 Purpose (Optional)">
              <Textarea
                placeholder="Describe the purpose of the trip..."
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="min-h-20 border-blue-300 dark:border-[#3b6dae]/40 text-xs"
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
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-white dark:bg-[#1f426b] font-medium text-black dark:text-slate-100"
              />
            </Row>
            <Row label="3.2 Departure Time">
              <Input
                type="time"
                value={form.departureTime}
                onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs"
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
                  className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Person(s)</span>
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
                <SelectTrigger className="w-full h-10 border-blue-300 dark:border-[#3b6dae]/40 bg-white dark:bg-[#1f426b] text-black dark:text-slate-100 font-medium focus:ring-blue-500">
                  <SelectValue placeholder="-- Select a Driver --" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1f426b] border-blue-200 dark:border-[#3b6dae]/30">
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
                  className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                  disabled
                />
              </Row>
            )}
          </Section>

          {/* 5. EMPLOYEE SIGNATURE */}
          <Section title="5. EMPLOYEE SIGNATURE">
            <Row label="5.1 Your Signature">
              <div className="space-y-3 w-full">
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      checked={form.signatureMethod === "draw"}
                      onChange={() => setForm({ ...form, signatureMethod: "draw", signatureFile: null, employeeSignatureUrl: "" })}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Draw Signature</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      checked={form.signatureMethod === "upload"}
                      onChange={() => setForm({ ...form, signatureMethod: "upload", signatureFile: null, employeeSignatureUrl: "" })}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Upload Image</span>
                  </label>
                </div>

                {form.signatureMethod === "upload" ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setForm((prev) => ({ 
                              ...prev, 
                              signatureFile: file, 
                              signaturePreview: URL.createObjectURL(file),
                              employeeSignatureUrl: ev.target?.result as string 
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                    />
                  </div>
                ) : (
                  <SignaturePad 
                    onSave={(dataUrl) => {
                      const file = base64ToFile(dataUrl, "signature.png");
                      setForm({ ...form, signatureFile: file, employeeSignatureUrl: dataUrl });
                    }}
                    onClear={() => {
                      setForm({ ...form, signatureFile: null, employeeSignatureUrl: "" });
                    }}
                  />
                )}
                
                {form.employeeSignatureUrl && form.signatureMethod === "upload" && (
                   <div className="mt-2 animate-in zoom-in duration-300">
                      <img src={form.employeeSignatureUrl} alt="sig" className="h-16 object-contain border-2 border-blue-100 rounded-xl p-2 bg-white text-black" />
                   </div>
                )}
              </div>
            </Row>
          </Section>

          {/* 6. APPROVAL WORKFLOW */}
          <Section title="6. APPROVAL WORKFLOW">
            <Row label="6.1 HR Approval">
              <Input
                value="Doreen MBABAZI"
                className="w-full h-8 border-blue-300 dark:border-[#3b6dae]/40 bg-gray-100 dark:bg-[#295482] text-black dark:text-slate-100 font-medium cursor-not-allowed max-w-[400px] mt-1 mb-1"
                disabled
              />
            </Row>
          </Section>
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-blue-400 dark:border-[#3b6dae]/50 bg-gray-50 dark:bg-[#1a385c] gap-4 mt-6">
          <div className="flex gap-2">
            {/* Action buttons hidden until approved */}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="border-blue-400 dark:border-[#3b6dae]/50"
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
        <div className="text-center text-xs text-gray-600 dark:text-slate-400 py-3 border-t border-gray-200 space-y-1">
          <p>www.centrika.rw</p>
          <p>1 | Centrika Ltd | Motto: Delivering Tomorrow's Solutions Today</p>
        </div>
      </div>
    </div>
  );
}

/* ========= Helper Components ========= */

function Section({ title, children, className = "" }: { title: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={`border-t border-blue-400 dark:border-[#3b6dae]/50 ${className}`}>
      <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children, colSpan = false }: { label: React.ReactNode, children: React.ReactNode, colSpan?: boolean }) {
  return (
    <div className={`grid ${colSpan ? 'grid-cols-1' : 'grid-cols-[220px_1fr]'} border-b border-blue-400 dark:border-[#3b6dae]/50`}>
      {!colSpan && (
        <div className="px-3 py-2 font-medium border-r border-blue-400 dark:border-[#3b6dae]/50 bg-blue-100 text-[#3b6dae] text-xs flex items-center">
          {label}
        </div>
      )}
      <div className="px-3 py-1 flex items-center">{children}</div>
    </div>
  );
}
