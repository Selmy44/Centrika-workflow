"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Eye, Paperclip, ArrowRight, ArrowLeftRight } from "lucide-react";
import ApprovalChainPreview from "@/components/forms/ApprovalChainPreview";
import { ApprovalRoutePreview } from "@/components/forms/ApprovalRoutePreview";
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
import { fileToBase64 } from "@/lib/fileUtils";
import { base64ToFile } from "@/lib/fileUtils";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Format an ISO date string (YYYY-MM-DD) to DD/MM/YYYY */
function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/** Generate a document ID: CR-YYYY-MM-NNNNN */
function generateDocId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 99999)).padStart(5, "0");
  return `CR-${year}-${month}-${seq}`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface CarRequestFormProps {
  requestData?: any;
  isReadOnly?: boolean;
  onSuccess: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CarRequestForm({ requestData, isReadOnly = false, onSuccess }: CarRequestFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    // Document / meta
    documentId: "",
    // Employee info (read-only, auto-filled)
    employeeName: "",
    staffId: "",
    department: "",
    position: "",
    workEmail: "",
    reportingManager: "",
    // Trip info
    title: "",
    destination: "",
    pickupLocation: "",
    purpose: "",
    tripType: "round_trip" as "one_way" | "round_trip",
    departureDate: "",
    departureTime: "",
    returnDate: "",
    returnTime: "",
    passengers: "1",
    // Driver & vehicle
    driverName: "",
    carInfo: "",
    // Signatures & attachments
    employeeSignatureUrl: "",
    signaturePreview: "",
    signatureFile: null as File | null,
    signatureMethod: "draw" as "upload" | "draw",
    supportingDocument: null as File | null,
    supportingDocumentUrl: "",
    managerSignatureUrl: "",
    hrSignatureUrl: "",
  });

  // ── Queries & mutations ──────────────────────────────────────────────────────

  const { data: drivers = [] } = trpc.requests.getAvailableDrivers.useQuery(undefined, {
    staleTime: Infinity, gcTime: Infinity,
    refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false, retry: 1,
  });

  const { data: heads = [] } = trpc.users.listHeads.useQuery(undefined, {
    staleTime: Infinity, gcTime: Infinity,
    refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false, retry: 1,
  });

  const savedFormData = (trpc as any).requests.getCarFormData.useQuery(
    { requestId: requestData?.id || 0 },
    {
      enabled: !!requestData?.id && (isReadOnly || requestData?.status === "draft"),
      staleTime: 5 * 60 * 1000,    // Serve from cache for 5 min — prevents blank flash
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const createCar = trpc.requests.createCarRequest.useMutation();
  const updateCar = (trpc as any).requests.updateCarRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();
  const storeFormData = trpc.requests.storeCarFormData.useMutation();
  const uploadAttachment = (trpc as any).requests.uploadAttachment.useMutation();

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Restore saved form data (draft / read-only)
  useEffect(() => {
    if (savedFormData.data) {
      const d = savedFormData.data;
      setForm((prev: any) => ({
        ...prev,
        // Document / meta
        documentId: d.documentId || prev.documentId,
        // Trip info — only restore if there is a non-empty saved value
        destination: d.destination || prev.destination,
        pickupLocation: d.pickupLocation || prev.pickupLocation,
        purpose: d.purpose || prev.purpose,
        tripType: d.tripType || prev.tripType,
        departureDate: d.departureDate || prev.departureDate,
        departureTime: d.departureTime || prev.departureTime,
        returnDate: d.returnDate || prev.returnDate,
        returnTime: d.returnTime || prev.returnTime,
        passengers: d.passengers || prev.passengers,
        // Driver
        driverName: d.driverName || prev.driverName,
        carInfo: d.carInfo || prev.carInfo,
        // Signatures
        employeeSignatureUrl: d.employeeSignatureUrl || prev.employeeSignatureUrl,
        signatureFile: null,
        signaturePreview: d.signaturePreview || prev.signaturePreview,
        supportingDocumentUrl: d.supportingDocumentUrl || prev.supportingDocumentUrl,
        hrSignatureUrl: d.hrSignatureUrl || requestData?.hrSignatureUrl || prev.hrSignatureUrl || "",
        managerSignatureUrl: d.managerSignatureUrl || requestData?.managerSignatureUrl || prev.managerSignatureUrl || "",
      }));
    }
  }, [savedFormData.data, requestData]);

  // Merge DB-level fields from requestData (always runs — covers read-only views too)
  useEffect(() => {
    if (requestData) {
      setForm((prev) => ({
        ...prev,
        // Signatures from DB
        managerSignatureUrl: requestData.managerSignatureUrl || prev.managerSignatureUrl || "",
        hrSignatureUrl: requestData.hrSignatureUrl || prev.hrSignatureUrl || "",
        // Trip fields from carRequest relation
        destination: requestData.carRequest?.destination || prev.destination,
        purpose: requestData.carRequest?.purpose || prev.purpose,
        departureDate: requestData.carRequest?.departureDate || prev.departureDate,
        departureTime: requestData.carRequest?.departureTime || prev.departureTime,
        passengers: requestData.carRequest?.passengers?.toString() || prev.passengers,
        driverName: requestData.carRequest?.driverName || prev.driverName,
        carInfo: requestData.carRequest?.carInfo || prev.carInfo,
        reportingManager: requestData.initialApproverId?.toString() || prev.reportingManager,
        // Employee info from requestData.user — critical for read-only views
        employeeName: requestData.user?.name || prev.employeeName,
        staffId: requestData.user?.staffId || prev.staffId,
        department: requestData.user?.department?.name || prev.department,
        position: requestData.user?.position || prev.position,
        workEmail: requestData.user?.email || prev.workEmail,
      }));
    }
  }, [requestData]);

  // Auto-fill employee info + generate document ID for new forms only
  useEffect(() => {
    if (user && autoFillData && !isReadOnly) {
      setForm((prev) => ({
        ...prev,
        documentId: prev.documentId || generateDocId(),
        employeeName: prev.employeeName || user.name || "",
        staffId: prev.staffId || user.staffId || "",
        department: prev.department || user.department?.name || "",
        position: prev.position || user.position || "",
        workEmail: prev.workEmail || user.email || "",
        reportingManager: autoFillData.managerId ? String(autoFillData.managerId) : prev.reportingManager,
      }));
    }
  }, [user, autoFillData, isReadOnly]);

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = () => {
    if (!form.destination.trim()) {
      toast.error("Destination is required");
      return false;
    }
    if (!form.pickupLocation.trim()) {
      toast.error("Pickup location is required");
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
    if (form.tripType === "round_trip") {
      if (!form.returnDate) {
        toast.error("Return date is required for round trips");
        return false;
      }
    }
    if (!form.driverName) {
      toast.error("Please select a driver and vehicle");
      return false;
    }
    const passengerCount = parseInt(form.passengers);
    if (isNaN(passengerCount) || passengerCount < 1 || passengerCount > 10) {
      toast.error("Passengers must be between 1 and 10");
      return false;
    }
    if (!form.employeeSignatureUrl) {
      toast.error("Please provide your signature");
      return false;
    }
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (submit: boolean) => {
    if (submit && !validate()) return;

    setIsSubmitting(true);
    try {
      const isEditing = requestData?.id && requestData?.status === "draft";

      const payload = {
        title: form.title || `Car Request — ${form.destination}`,
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
        await updateCar.mutateAsync({ requestId: requestData.id, ...payload });
        requestId = requestData.id;
      } else {
        const created = await createCar.mutateAsync(payload);
        requestId = (created as any)?.id as number;
      }

      if (requestId) {
        let finalSupportingDocUrl = form.supportingDocumentUrl;

        if (form.supportingDocument) {
          try {
            const base64 = await fileToBase64(form.supportingDocument);
            const uploadResult = await uploadAttachment.mutateAsync({
              requestId,
              fileName: form.supportingDocument.name,
              fileData: base64,
              mimeType: form.supportingDocument.type,
              attachmentType: "supporting_document",
            });
            finalSupportingDocUrl = uploadResult.fileUrl;
          } catch (e) {
            console.error("Failed to upload supporting document", e);
          }
        }

        try {
          await storeFormData.mutateAsync({
            requestId,
            formData: {
              ...form,
              signatureFile: null,
              supportingDocument: null,
              supportingDocumentUrl: finalSupportingDocUrl,
            },
          });
        } catch (e) { console.error("Failed to store form data", e); }
      }

      if (submit) {
        await submitRequest.mutateAsync({ id: requestId });
      }

      toast.success(submit ? "🎉 Car request successfully submitted!" : "Draft saved");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  // ── Derived values ────────────────────────────────────────────────────────────

  const displayDocId = form.documentId || (requestData?.id ? `CR-${new Date(requestData.createdAt).getFullYear()}-${String(new Date(requestData.createdAt).getMonth() + 1).padStart(2, "0")}-${String(requestData.id).padStart(5, "0")}` : "");
  const todayDisplay = formatDate(new Date().toISOString().split("T")[0]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full bg-white dark:bg-[#1f426b] text-black dark:text-slate-100 px-4 leave-form-container relative dark:border-[#2b6cb0]/30">

      <div>
        {/* ===== HEADER ===== */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start px-3 lg:px-6 py-3 gap-4 lg:gap-8">
          <div className="shrink-0">
            <img src="/logo/centrikaLogo.png" alt="Centrika Logo" className="h-14 lg:h-20 w-auto" />
          </div>
          <div className="text-xs lg:text-sm flex-1 flex justify-start lg:justify-end">
            <div className="flex flex-col gap-2 lg:gap-3 items-start">
              <div className="flex items-center gap-2 min-w-0">
                <Phone size={14} className="text-blue-600 shrink-0 lg:w-[16px] lg:h-[16px]" />
                <span className="text-blue-600 font-semibold truncate text-[11px] lg:text-sm">+250 788 123 099</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Mail size={14} className="text-blue-600 shrink-0 lg:w-[16px] lg:h-[16px]" />
                <span className="text-blue-600 font-semibold truncate text-[11px] lg:text-sm">info@centrika.rw</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Globe size={14} className="text-blue-600 shrink-0 lg:w-[16px] lg:h-[16px]" />
                <span className="text-blue-600 font-semibold truncate text-[11px] lg:text-sm">www.centrika.rw</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5 lg:w-[16px] lg:h-[16px]" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-blue-600 font-semibold text-[10px] lg:text-sm leading-tight">Room F002, 2nd Floor, CHIC Building,</span>
                  <span className="text-blue-600 font-semibold text-[10px] lg:text-sm leading-tight">Plot 1007, KN2 Kigali-Rwanda</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== TITLE BAR ===== */}
        <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide">
          CAR / TRANSPORT REQUEST FORM
        </div>

        {/* ===== FORM BODY ===== */}
        <div className="">
          <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

          {/* ── 1. EMPLOYEE INFORMATION ── */}
          <Section title="1. EMPLOYEE INFORMATION">
            <Row label="1.1 Request Number">
              <Input
                value={displayDocId}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.2 Date of Request">
              <Input
                value={isReadOnly && requestData?.createdAt
                  ? formatDate(new Date(requestData.createdAt).toISOString().split("T")[0])
                  : todayDisplay}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.3 Employee Full Name">
              <Input value={form.employeeName} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.4 Department">
              <Input value={form.department} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.5 Employee / Staff ID">
              <Input value={form.staffId} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.6 Position / Title">
              <Input value={form.position} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.7 Work Email">
              <Input value={form.workEmail} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" disabled />
            </Row>
          </Section>

          {/* ── 2. TRIP DETAILS ── */}
          <Section title="2. TRIP DETAILS">
            {/* Trip type toggle */}
            <Row label={<span>2.1 Trip Type <span className="text-red-500">*</span></span>}>
              {isReadOnly ? (
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${form.tripType === "round_trip" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"}`}>
                    {form.tripType === "round_trip" ? <><ArrowLeftRight size={11} /> Round Trip</> : <><ArrowRight size={11} /> One Way</>}
                  </span>
                </div>
              ) : (
                <div className="flex gap-2 py-1">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, tripType: "round_trip", returnDate: "", returnTime: "" }))}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${form.tripType === "round_trip" ? "bg-[#3b6dae] text-white border-[#3b6dae] shadow-sm" : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#3b6dae] hover:text-[#3b6dae]"}`}
                  >
                    <ArrowLeftRight size={11} /> Round Trip
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, tripType: "one_way", returnDate: "", returnTime: "" }))}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${form.tripType === "one_way" ? "bg-[#3b6dae] text-white border-[#3b6dae] shadow-sm" : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#3b6dae] hover:text-[#3b6dae]"}`}
                  >
                    <ArrowRight size={11} /> One Way
                  </button>
                </div>
              )}
            </Row>

            <Row label={<span>2.2 Pickup Location <span className="text-red-500">*</span></span>}>
              <Input
                placeholder="e.g., Centrika Office — CHIC Building"
                value={form.pickupLocation}
                onChange={(e) => setForm(prev => ({ ...prev, pickupLocation: e.target.value }))}
                className={`border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs ${isReadOnly ? "bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" : ""}`}
                disabled={isReadOnly}
              />
            </Row>

            <Row label={<span>2.3 Destination <span className="text-red-500">*</span></span>}>
              <Input
                placeholder="e.g., Kigali International Airport"
                value={form.destination}
                onChange={(e) => setForm(prev => ({ ...prev, destination: e.target.value }))}
                className={`border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs ${isReadOnly ? "bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" : ""}`}
                disabled={isReadOnly}
              />
            </Row>

            <Row label={<span>2.4 Departure Date <span className="text-red-500">*</span></span>}>
              {isReadOnly ? (
                <Input
                  value={formatDate(form.departureDate)}
                  className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                  disabled
                />
              ) : (
                <SingleDatePicker
                  value={form.departureDate}
                  onChange={(date) => setForm(prev => ({ ...prev, departureDate: date }))}
                  label=""
                  className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs font-medium text-black dark:text-slate-100 bg-white dark:bg-[#1f426b]"
                  disabled={false}
                  disablePastDates={true}
                  highlightWeekends={true}
                  highlightToday={true}
                />
              )}
            </Row>

            <Row label={<span>2.5 Departure Time <span className="text-red-500">*</span></span>}>
              <Input
                type="time"
                value={form.departureTime}
                onChange={(e) => setForm(prev => ({ ...prev, departureTime: e.target.value }))}
                className={`border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs w-36 ${isReadOnly ? "bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" : ""}`}
                disabled={isReadOnly}
                placeholder="--:--"
              />
            </Row>

            {/* Return fields — only for round trip */}
            {form.tripType === "round_trip" && (
              <>
                <Row label={<span>2.6 Return Date <span className="text-red-500">*</span></span>}>
                  {isReadOnly ? (
                    <Input
                      value={formatDate(form.returnDate)}
                      className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                      disabled
                    />
                  ) : (
                    <SingleDatePicker
                      value={form.returnDate}
                      onChange={(date) => setForm(prev => ({ ...prev, returnDate: date }))}
                      label=""
                      className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs font-medium text-black dark:text-slate-100 bg-white dark:bg-[#1f426b]"
                      disabled={false}
                      disablePastDates={true}
                      highlightWeekends={true}
                      highlightToday={true}
                    />
                  )}
                </Row>
                <Row label="2.7 Return Time">
                  <Input
                    type="time"
                    value={form.returnTime}
                    onChange={(e) => setForm(prev => ({ ...prev, returnTime: e.target.value }))}
                    className={`border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs w-36 ${isReadOnly ? "bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" : ""}`}
                    disabled={isReadOnly}
                  />
                </Row>
              </>
            )}

            <Row label="2.8 Number of Passengers">
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={form.passengers}
                  onChange={(e) => setForm(prev => ({ ...prev, passengers: e.target.value }))}
                  className={`border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs w-20 ${isReadOnly ? "bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" : ""}`}
                  disabled={isReadOnly}
                />
                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Person(s)</span>
              </div>
            </Row>
          </Section>

          {/* ── 3. TRIP PURPOSE ── */}
          <Section title="3. TRIP PURPOSE">
            <Row label="3.1 Request Title (Optional)">
              <Input
                placeholder="e.g., Client Meeting, Airport Transfer"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className={`border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs ${isReadOnly ? "bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" : ""}`}
                disabled={isReadOnly}
              />
            </Row>
            <Row label="3.2 Purpose / Reason (Optional)">
              <Textarea
                placeholder="Describe the purpose of the trip in detail..."
                value={form.purpose}
                onChange={(e) => setForm(prev => ({ ...prev, purpose: e.target.value }))}
                className={`min-h-20 border-blue-300 dark:border-[#3b6dae]/40 text-xs ${isReadOnly ? "bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" : ""}`}
                disabled={isReadOnly}
              />
            </Row>
          </Section>

          {/* ── 4. DRIVER & VEHICLE ── */}
          <Section title="4. DRIVER & VEHICLE">
            <Row label={<span>4.1 Select Driver & Car <span className="text-red-500">*</span></span>}>
              <Select
                value={form.driverName}
                onValueChange={(v) => {
                  const driver = drivers.find((d: any) => d.name === v);
                  setForm(prev => ({ ...prev, driverName: v, carInfo: driver?.car || "" }));
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger className={`w-full h-10 border-blue-300 dark:border-[#3b6dae]/40 text-black dark:text-slate-100 font-medium focus:ring-blue-500 ${isReadOnly ? "bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100" : "bg-white dark:bg-[#1f426b]"}`}>
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
                  className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                  disabled
                />
              </Row>
            )}
          </Section>

          {/* ── 5. EMPLOYEE SIGNATURE ── */}
          <Section title="5. EMPLOYEE SIGNATURE">
            <Row label="5.1 Your Signature">
              <div className="space-y-3 w-full">
                {isReadOnly ? (
                  <div className="space-y-1">
                    {form.employeeSignatureUrl ? (
                      <>
                        <img src={form.employeeSignatureUrl} alt="Employee Signature" className="h-14 object-contain" />
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{form.employeeName || requestData?.user?.name || ""}</p>
                      </>
                    ) : (
                      <p className="text-xs italic text-gray-500">No signature provided</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, signatureMethod: "draw", signatureFile: null, employeeSignatureUrl: "" }))}
                        className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${form.signatureMethod === "draw" ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm" : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"} cursor-pointer`}
                      >
                        Draw
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, signatureMethod: "upload", signatureFile: null, employeeSignatureUrl: "" }))}
                        className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${form.signatureMethod === "upload" ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm" : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"} cursor-pointer`}
                      >
                        Upload image
                      </button>
                    </div>

                    {form.signatureMethod === "upload" ? (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        {form.employeeSignatureUrl ? (
                          <div className="flex items-center gap-3 bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3">
                            <Paperclip size={14} className="text-blue-600 shrink-0" />
                            <span className="text-xs font-medium text-blue-800 dark:text-blue-200 flex-1 truncate">{form.signatureFile?.name || "Signature image"}</span>
                            <button type="button" onClick={() => setForm(prev => ({ ...prev, signatureFile: null, employeeSignatureUrl: "" }))} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-[#3b6dae]/50 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/50 transition-all duration-200 w-fit">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+ Upload signature image</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setForm((prev) => ({ ...prev, signatureFile: file, signaturePreview: URL.createObjectURL(file), employeeSignatureUrl: ev.target?.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </label>
                        )}
                      </div>
                    ) : (
                      <SignaturePad
                        onSave={(dataUrl) => {
                          const file = base64ToFile(dataUrl, "signature.png");
                          setForm(prev => ({ ...prev, signatureFile: file, employeeSignatureUrl: dataUrl }));
                        }}
                        onClear={() => {
                          setForm(prev => ({ ...prev, signatureFile: null, employeeSignatureUrl: "" }));
                        }}
                      />
                    )}

                    {form.employeeSignatureUrl && form.signatureMethod === "upload" && (
                      <div className="mt-2 animate-in zoom-in duration-300">
                        <img src={form.employeeSignatureUrl} alt="sig" className="h-16 object-contain" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </Row>
          </Section>

          {/* Draft-only: approval route preview (no section header) */}
          {!isReadOnly && (() => {
            const empInitials = (user?.name || "Me").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <ApprovalRoutePreview steps={[
                { initials: empInitials, name: user?.name || "You", role: "Submitter", isSubmitter: true },
                { initials: "HR", name: "HR Department", role: "HR Approver" },
              ]} />
            );
          })()}

          {/* 6. APPROVER SIGNATURES — only after resolution */}
          {(requestData?.status === "approved" || requestData?.status === "rejected") && (
          <Section title="6. APPROVER SIGNATURES">
            {form.hrSignatureUrl && (requestData?.status === "approved" || requestData?.status === "rejected") && (() => {
              const hrApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "hr");
              const hrName = savedFormData.data?.hrSignerName || hrApproval?.approver?.name || "HR Department";
              return (
                <Row label="6.1 HR Approver">
                  <div className="py-1">
                    <img src={form.hrSignatureUrl} alt="HR Signature" className="h-10 object-contain" />
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">✓ {hrName}</p>
                  </div>
                </Row>
              );
            })()}
          </Section>
          )}

          {/* 7. APPROVAL CHAIN (preview) */}
          {(isReadOnly || requestData?.status === "pending" || requestData?.status === "approved" || requestData?.status === "rejected") && (
            <Section title="7. APPROVAL CHAIN (preview)">
              <div className="px-3 lg:px-4 py-3 lg:py-4">
                <ApprovalChainPreview
                  requestType="car"
                  currentApprovalLevel={requestData?.currentApprovalLevel}
                  status={requestData?.status || "draft"}
                  approvals={requestData?.approvals || []}
                />
              </div>
            </Section>
          )}
        </div>

        {/* ===== ACTIONS ===== */}
        {!isReadOnly && (
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center px-3 lg:px-6 py-3 lg:py-4 bg-gray-50 dark:bg-[#1a385c] gap-2 lg:gap-4 mt-6">
            <div className="flex gap-2">{/* Print/Download hidden until approved */}</div>
            <div className="flex flex-col lg:flex-row gap-2 w-full lg:justify-end">
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
                Submit for Approval
              </Button>
            </div>
          </div>
        )}

        {/* ===== FOOTER ===== */}
        <div className="text-center text-xs text-gray-600 dark:text-slate-400 py-3 border-t border-gray-200 space-y-1">
          <p>www.centrika.rw</p>
          <p>© {new Date().getFullYear()} | Centrika Ltd | Delivering Tomorrow's Solutions Today</p>
        </div>
      </div>
    </div>
  );
}

/* ── Helper Components ───────────────────────────────────────────────────────── */

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="lg:bg-[#3b6dae] lg:text-white font-bold px-4 py-2 text-sm">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children, colSpan = false }: { label: React.ReactNode; children: React.ReactNode; colSpan?: boolean }) {
  return (
    <div className={`grid ${colSpan ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[220px_1fr]"} gap-0`}>
      {!colSpan && (
        <div className="px-2 lg:px-3 py-1.5 lg:py-2 font-medium lg:bg-blue-100 text-[#3b6dae] text-[10px] lg:text-xs flex items-center">
          {label}
        </div>
      )}
      <div className="px-2 lg:px-3 py-1 flex items-center">{children}</div>
    </div>
  );
}
