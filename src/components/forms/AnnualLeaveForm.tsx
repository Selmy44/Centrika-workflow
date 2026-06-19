"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, AlertCircle, User, Building2, Paperclip } from "lucide-react";
import ApprovalChainPreview from "@/components/forms/ApprovalChainPreview";
import { ApprovalRoutePreview } from "@/components/forms/ApprovalRoutePreview";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DateRangePicker from "@/components/DateRangePicker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { LeaveBalanceCalculator } from "./shared/LeaveBalanceCalculator";
import { SignaturePad } from "@/components/SignaturePad";
import { base64ToFile } from "@/lib/fileUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  requestData?: any;
  isReadOnly?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
  onBack?: () => void;
  isApprover?: boolean;
  onApprove?: (data: any) => void;
  onReject?: (reason: string) => void;
  isLoading?: boolean;
}

/**
 * Annual Leave Form - Professional document-style design
 * Matches CarRequestForm / ExpenditureRequestForm / AssetRequestForm layout
 */
export default function AnnualLeaveForm({
  requestData,
  isReadOnly = false,
  onSuccess,
  onClose,
  onBack,
  isApprover: propsIsApprover,
  onApprove,
  onReject,
  isLoading = false,
}: Props) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [takenLeaveDates, setTakenLeaveDates] = useState<string[]>([]);
  const [isEligible, setIsEligible] = useState(true);

  const [approvalComments, setApprovalComments] = useState("");
  const [approverSignature, setApproverSignature] = useState<File | null>(null);
  const [approverSignatureUrl, setApproverSignatureUrl] = useState("");
  const [approverSignatureMethod, setApproverSignatureMethod] = useState<"upload" | "draw">("draw");
  const [selectedHR, setSelectedHR] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const isApprover = propsIsApprover !== undefined ? propsIsApprover : (!!onApprove || !!onReject);
  const effectiveIsReadOnly = isReadOnly || isApprover;

  const [form, setForm] = useState({
    documentId: "",
    requestNumber: "",
    departmentHeader: "COMP",
    leaveType: "annual",
    year: new Date().getFullYear().toString(),
    month: String(new Date().getMonth() + 1).padStart(2, "0"),
    employeeName: "",
    dateOfEmployment: "",
    staffId: "",
    department: "",
    position: "",
    workEmail: "",
    startDate: "",
    endDate: "",
    leaveDaysRequested: "",
    outsideCountry: "no",
    contactDuringLeave: "",
    leaveDaysEntitled: "",
    leaveDaysTaken: "",
    leaveDaysRemaining: "",
    reportingManager: "",
    employeeSignature: null as File | null,
    employeeSignatureUrl: "" as string,
    signatureDate: new Date().toISOString().split("T")[0],
    signatureMethod: "draw" as "upload" | "draw",
    managerSignatureUrl: "",
    handoverPersonId: "",
    handoverPersonName: "",
    handoverPersonPhone: "",
    handoverPersonEmail: "",
    handoverPersonPosition: "",
    handoverPersonDepartment: "",
    handoverResponsibilities: "",
    handoverDocument: null as File | null,
    handoverDocumentUrl: "",
  });

  const { data: heads = [] } = trpc.users.listHeads.useQuery(undefined, {
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });

  const uniqueHeads = Array.from(
    new Map(heads.map((h: any) => [h.id, h])).values()
  );

  const createLeave = trpc.requests.createLeaveRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();
  const storeFormData = (trpc as any).requests.storeLeaveFormData.useMutation();

  // Fetch staff list for handover person picker
  const staffForBackup = (trpc as any).users.listStaffForBackup.useQuery();

  // Fetch saved form data for draft/read-only views
  const savedFormData = (trpc as any).requests.getLeaveFormData.useQuery(
    { requestId: requestData?.id || 0 },
    {
      enabled: !!requestData?.id && (isReadOnly || isApprover || requestData?.status === "draft"),
      staleTime: 5 * 60 * 1000,    // Serve from cache 5 min — prevents blank flash on re-open
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Merge saved form data when available
  useEffect(() => {
    if (savedFormData.data) {
      const d = savedFormData.data;
      setForm((prev: any) => ({
        ...prev,
        ...d,
        employeeSignature: null, // Don't restore file objects
      }));
    }
  }, [savedFormData.data]);

  // Merge requestData fields — always runs, including for read-only/approved views
  useEffect(() => {
    if (requestData) {
      setForm((prev) => ({
        ...prev,
        managerSignatureUrl: requestData.managerSignatureUrl || prev.managerSignatureUrl || "",
        documentId: requestData.leaveRequest?.documentId || prev.documentId,
        startDate: requestData.leaveRequest?.startDate || prev.startDate,
        endDate: requestData.leaveRequest?.endDate || prev.endDate,
        leaveDaysRequested: requestData.leaveRequest?.leaveDaysRequested?.toString() || prev.leaveDaysRequested,
        leaveDaysEntitled: requestData.leaveRequest?.leaveDaysEntitled?.toString() || prev.leaveDaysEntitled,
        leaveDaysTaken: requestData.leaveRequest?.leaveDaysTaken?.toString() || prev.leaveDaysTaken,
        leaveDaysRemaining: requestData.leaveRequest?.leaveDaysRemaining?.toString() || prev.leaveDaysRemaining,
        reportingManager: requestData.initialApproverId?.toString() || prev.reportingManager,
        // Employee info from requestData.user — critical for read-only views
        employeeName: requestData.user?.name || prev.employeeName,
        staffId: requestData.user?.staffId || prev.staffId,
        department: requestData.user?.department?.name || prev.department,
        position: requestData.user?.position || prev.position,
        workEmail: requestData.user?.email || prev.workEmail,
        dateOfEmployment: requestData.user?.dateOfEmployment || prev.dateOfEmployment,
        // Handover fields from the LeaveRequest DB record
        handoverPersonName: requestData.leaveRequest?.backupPersonName || prev.handoverPersonName,
        handoverPersonPhone: requestData.leaveRequest?.backupPersonPhone || prev.handoverPersonPhone,
        handoverPersonId: requestData.leaveRequest?.handoverPersonId ? String(requestData.leaveRequest.handoverPersonId) : prev.handoverPersonId,
        handoverPersonEmail: requestData.leaveRequest?.handoverPersonEmail || prev.handoverPersonEmail,
        handoverResponsibilities: requestData.leaveRequest?.handoverResponsibilities || prev.handoverResponsibilities,
      }));
    }
  }, [requestData]);

  // Auto-fill for new forms only — use prev.field || value to never overwrite existing data
  useEffect(() => {
    if (user && autoFillData && !effectiveIsReadOnly) {
      const sequence = String(Math.floor(Math.random() * 10000)).padStart(5, "0");
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
      const docId = `AL-${new Date().getFullYear()}-${currentMonth}-${sequence}`;

      setForm((prev) => ({
        ...prev,
        documentId: prev.documentId || docId,
        employeeName: prev.employeeName || user.name || "",
        staffId: prev.staffId || user.staffId || "",
        department: prev.department || user.department?.name || "",
        position: prev.position || user.position || "",
        workEmail: prev.workEmail || user.email || "",
        dateOfEmployment: prev.dateOfEmployment || autoFillData.dateOfEmployment || "",
        reportingManager: prev.reportingManager || (autoFillData.managerId ? String(autoFillData.managerId) : ""),
      }));
    }
  }, [user, autoFillData, effectiveIsReadOnly]);

  const validate = () => {
    if (!form.startDate || !form.endDate) {
      toast.error("Start and end dates are required");
      return false;
    }
    if (form.endDate < form.startDate) {
      toast.error("End date must be after start date");
      return false;
    }
    if (!form.contactDuringLeave.trim()) {
      toast.error("Contact details during leave are required");
      return false;
    }
    if (!form.handoverPersonId) {
      toast.error("Please select a cover person for handover");
      return false;
    }
    if (!form.handoverResponsibilities.trim()) {
      toast.error("Please describe the responsibilities being handed over");
      return false;
    }
    if (!form.reportingManager) {
      toast.error("Please select a reporting manager / HOD");
      return false;
    }
    if (!form.leaveDaysRequested || parseInt(form.leaveDaysRequested) <= 0) {
      toast.error("Requested days must be greater than 0. Please check your dates.");
      return false;
    }
    const remaining = parseInt(form.leaveDaysRemaining);
    if (!isNaN(remaining) && remaining < 0) {
      toast.error("You do not have enough leave balance for this request");
      return false;
    }
    return true;
  };

  const handleSubmit = async (submit: boolean) => {
    if (!isEligible) {
      toast.error("You must be employed for at least one year to apply for Annual Leave.");
      return;
    }
    if (submit && !validate()) return;

    setIsSubmitting(true);
    try {
      const created = await createLeave.mutateAsync({
        title: `Annual Leave Request - ${form.documentId}`,
        leaveType: "annual" as any,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.contactDuringLeave,
        leaveDaysEntitled: parseInt(form.leaveDaysEntitled) || 0,
        leaveDaysTaken: parseInt(form.leaveDaysTaken) || 0,
        leaveDaysRequested: parseInt(form.leaveDaysRequested) || 0,
        backupPersonName: form.handoverPersonName || undefined,
        backupPersonPhone: form.handoverPersonPhone || undefined,
        handoverPersonId: form.handoverPersonId ? parseInt(form.handoverPersonId) : undefined,
        handoverPersonEmail: form.handoverPersonEmail || undefined,
        handoverResponsibilities: form.handoverResponsibilities || undefined,
      });

      const requestId = (created as any)?.id as number;

      if (submit && requestId) {
        await submitRequest.mutateAsync({
          id: requestId,
          initialApproverId: parseInt(form.reportingManager),
        });

        // Store the full form data JSON so the approver can see the complete form
        try {
          await storeFormData.mutateAsync({
            requestId: requestId,
            formData: {
              ...form,
              employeeSignature: undefined, // Can't serialize File objects
              leaveType: "annual",
            },
          });
        } catch (e) {
          console.error("Failed to store form data", e);
        }
      }

      toast.success(submit ? "Annual leave request submitted successfully!" : "Draft saved");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="w-full bg-white dark:bg-[#1f426b] text-black dark:text-slate-100 px-4 leave-form-container relative dark:border-[#2b6cb0]/30">

      <div>
        {/* ===== HEADER WITH LOGO AND CONTACT INFO ===== */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start px-3 lg:px-6 py-3 gap-4 lg:gap-8">
          <div className="shrink-0">
            <img
              src="/logo/centrikaLogo.png"
              alt="Centrika Logo"
              className="h-14 lg:h-20 w-auto"
            />
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

        {/* ===== TITLE BAR (GOLDEN/YELLOW) ===== */}
        <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide uppercase">
          Annual Leave Request Form
        </div>

        {/* ELIGIBILITY WARNING BANNER — only shown to the employee creating the form, never to approvers */}
        {!isEligible && !effectiveIsReadOnly && (
          <div className="mx-3 lg:mx-6 mt-4 mb-2 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-lg flex items-start gap-3 shadow-xs">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                Annual Leave Not Available
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                You must have at least 1 year of service to apply for Annual Leave.
                Your Date of Employment is <span className="font-bold">{form.dateOfEmployment || "not set"}</span>.
              </p>
            </div>
          </div>
        )}

        {/* ===== REQUEST HEADER SECTION (hidden — kept for future use) =====
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 lg:gap-3 px-3 lg:px-6 py-2 lg:py-3 text-xs lg:text-sm items-end">
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-xs uppercase tracking-tighter">CTK</p>
            <div className="flex gap-0 items-center">
              <Input value={form.department} className="w-full h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
            </div>
          </div>
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-xs">Nature of Leave</p>
            <Input value="Annual Leave" className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Year</p>
            <Input value={form.year} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Month</p>
            <Input value={form.month} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Document ID</p>
            <Input value={form.documentId} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
          </div>
        </div>
        ===== */}

        {/* ===== REQUEST DETAILS ===== */}
        <div>
          <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

          {/* 1. EMPLOYEE INFORMATION */}
          <Section title="1. EMPLOYEE INFORMATION">
            <Row label="1.1 Request Number">
              <Input
                value={form.documentId}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.2 Employee Full Name">
              <Input
                value={form.employeeName}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.3 Department">
              <Input
                value={form.department}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.4 Employee / Staff ID">
              <Input
                value={form.staffId}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.5 Position / Title">
              <Input
                value={form.position}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.6 Date of Employment">
              <Input
                type="date"
                value={form.dateOfEmployment}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.7 Work Email">
              <Input
                value={form.workEmail}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
          </Section>

          {/* 2. LEAVE DETAILS */}
          <Section title="2. LEAVE DETAILS">
            <Row label="2.1 Leave Duration (Start – End)">
              <DateRangePicker
                startDate={form.startDate}
                endDate={form.endDate}
                onStartDateChange={(date) => setForm({ ...form, startDate: date })}
                onEndDateChange={(date) => setForm({ ...form, endDate: date })}
                maxDays={18}
                disabled={effectiveIsReadOnly}
                takenLeaveDates={takenLeaveDates}
              />
            </Row>

            <div className="px-4 pb-4">
              <LeaveBalanceCalculator
                leaveType="annual"
                startDate={form.startDate}
                endDate={form.endDate}
                alreadyTaken={parseInt(form.leaveDaysTaken) || 0}
                onTakenChange={(val) => setForm(prev => ({ ...prev, leaveDaysTaken: val.toString() }))}
                onCalculated={(data: any) => {
                  if (
                    form.leaveDaysRequested !== data.requested.toString() ||
                    form.leaveDaysRemaining !== data.remaining.toString() ||
                    form.leaveDaysEntitled !== data.entitled.toString() ||
                    form.leaveDaysTaken !== data.taken.toString()
                  ) {
                    setForm(prev => ({
                      ...prev,
                      leaveDaysRequested: data.requested.toString(),
                      leaveDaysRemaining: data.remaining.toString(),
                      leaveDaysEntitled: data.entitled.toString(),
                      leaveDaysTaken: data.taken.toString()
                    }));
                  }
                  if (data.takenLeaveDates) {
                    setTakenLeaveDates(data.takenLeaveDates);
                  }
                  if (data.isEligible !== undefined && data.isEligible !== isEligible) {
                    setIsEligible(data.isEligible);
                  }
                }}
                readOnlyData={effectiveIsReadOnly ? {
                  entitled: parseInt(form.leaveDaysEntitled) || 0,
                  taken: parseInt(form.leaveDaysTaken) || 0,
                  requested: parseInt(form.leaveDaysRequested) || 0,
                  remaining: parseInt(form.leaveDaysRemaining) || 0,
                  isEligible: true,
                } : undefined}
              />
            </div>

            <Row label="2.2 Number of Leave Days Requested">
              <Input
                value={form.leaveDaysRequested}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium w-24"
                disabled
              />
            </Row>
            <Row label="2.3 Will You Be Outside the Country?">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => !effectiveIsReadOnly && setForm({ ...form, outsideCountry: "yes" })}
                  disabled={effectiveIsReadOnly}
                  className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    form.outsideCountry === "yes"
                      ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                      : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"
                  } ${effectiveIsReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => !effectiveIsReadOnly && setForm({ ...form, outsideCountry: "no" })}
                  disabled={effectiveIsReadOnly}
                  className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    form.outsideCountry === "no"
                      ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                      : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"
                  } ${effectiveIsReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                  No
                </button>
              </div>
            </Row>
          </Section>

          {/* LEAVE HANDOVER — Separate section with its own blue header */}
          <Section title="LEAVE HANDOVER">
            <div className="px-3 lg:px-6 py-3 lg:py-4">
              <div className="space-y-4 w-full">
                {effectiveIsReadOnly ? (
                  /* ── READ-ONLY / APPROVER VIEW ── */
                  <div className="space-y-4">
                    {/* Cover Person Card — matches the edit-mode blue card design */}
                    <div>
                      <label className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2 block">Cover Person</label>
                      {form.handoverPersonName ? (
                        <div className="bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-blue-600 shrink-0" />
                            <span className="text-xs font-bold text-blue-800 dark:text-blue-200">{form.handoverPersonName}</span>
                          </div>
                          {form.handoverPersonPhone && (
                            <div className="flex items-center gap-2">
                              <Phone size={12} className="text-blue-500 shrink-0" />
                              <span className="text-xs text-blue-700 dark:text-blue-300">{form.handoverPersonPhone}</span>
                            </div>
                          )}
                          {form.handoverPersonEmail && (
                            <div className="flex items-center gap-2">
                              <Mail size={12} className="text-blue-500 shrink-0" />
                              <span className="text-xs text-blue-700 dark:text-blue-300">{form.handoverPersonEmail}</span>
                            </div>
                          )}
                          {(form.handoverPersonDepartment || form.handoverPersonPosition) && (
                            <div className="flex items-center gap-2">
                              <Building2 size={12} className="text-blue-500 shrink-0" />
                              <span className="text-xs text-blue-700 dark:text-blue-300">
                                {form.handoverPersonDepartment}{form.handoverPersonPosition ? ` \u2022 ${form.handoverPersonPosition}` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No cover person selected</p>
                      )}
                    </div>

                    {/* Responsibilities */}
                    {form.handoverResponsibilities && (
                      <div>
                        <label className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1 block">Responsibilities / Tasks Being Handed Over</label>
                        <div className="bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3">
                          <p className="text-xs whitespace-pre-wrap text-blue-800 dark:text-blue-200">{form.handoverResponsibilities}</p>
                        </div>
                      </div>
                    )}

                    {/* Handover Document (read-only) */}
                    {form.handoverDocumentUrl && (
                      <div>
                        <label className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1 block">Handover Document</label>
                        <div className="flex items-center gap-2">
                          <a href={form.handoverDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                            <Paperclip size={12} /> View attached document
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── EDIT MODE ── */
                  <>
                    {/* Cover Person Dropdown */}
                    <div>
                      <label className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1 block">Cover Person *</label>
                      <Select
                        value={form.handoverPersonId}
                        onValueChange={(val) => {
                          const selectedStaff = staffForBackup.data?.find((s: any) => String(s.id) === val);
                          setForm({
                            ...form,
                            handoverPersonId: val,
                            handoverPersonName: selectedStaff?.name || "",
                            handoverPersonPhone: selectedStaff?.phoneNumber || "",
                            handoverPersonEmail: selectedStaff?.email || "",
                            handoverPersonPosition: selectedStaff?.position || "",
                            handoverPersonDepartment: selectedStaff?.department || "",
                            contactDuringLeave: `Handover to: ${selectedStaff?.name || ""}${selectedStaff?.phoneNumber ? " | Tel: " + selectedStaff.phoneNumber : ""}`,
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 w-full border-blue-300 dark:border-[#3b6dae]/40 text-xs">
                          <SelectValue placeholder="Select a staff member to cover for you..." />
                        </SelectTrigger>
                        <SelectContent>
                          {staffForBackup.data
                            ?.filter((s: any) => s.id !== user?.id)
                            .map((s: any) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{s.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {s.position && <span>{s.position} \u2022 </span>}
                                    {s.department}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Auto-populated Contact Details */}
                    {form.handoverPersonId && (
                      <div className="bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3 space-y-1.5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-blue-600 shrink-0" />
                          <span className="text-xs font-bold text-blue-800 dark:text-blue-200">{form.handoverPersonName}</span>
                        </div>
                        {form.handoverPersonPhone && (
                          <div className="flex items-center gap-2">
                            <Phone size={12} className="text-blue-500 shrink-0" />
                            <span className="text-xs text-blue-700 dark:text-blue-300">{form.handoverPersonPhone}</span>
                          </div>
                        )}
                        {form.handoverPersonEmail && (
                          <div className="flex items-center gap-2">
                            <Mail size={12} className="text-blue-500 shrink-0" />
                            <span className="text-xs text-blue-700 dark:text-blue-300">{form.handoverPersonEmail}</span>
                          </div>
                        )}
                        {(form.handoverPersonDepartment || form.handoverPersonPosition) && (
                          <div className="flex items-center gap-2">
                            <Building2 size={12} className="text-blue-500 shrink-0" />
                            <span className="text-xs text-blue-700 dark:text-blue-300">
                              {form.handoverPersonDepartment}{form.handoverPersonPosition ? ` \u2022 ${form.handoverPersonPosition}` : ""}
                            </span>
                          </div>
                        )}
                        {!form.handoverPersonPhone && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 italic">No phone number on file for this staff member</p>
                        )}
                      </div>
                    )}

                    {/* Handover Responsibilities */}
                    <div>
                      <label className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1 block">Responsibilities / Tasks Being Handed Over *</label>
                      <Textarea
                        value={form.handoverResponsibilities}
                        onChange={(e) => setForm({ ...form, handoverResponsibilities: e.target.value })}
                        placeholder="List the tasks / duties the cover person will handle..."
                        className="min-h-20 border-blue-300 dark:border-[#3b6dae]/40 text-xs"
                      />
                    </div>

                    {/* Attach Handover Document */}
                    <div>
                      <label className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1 block">Attach Handover Document *</label>
                      {form.handoverDocument ? (
                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3">
                          <Paperclip size={14} className="text-blue-600 shrink-0" />
                          <span className="text-xs font-medium text-blue-800 dark:text-blue-200 flex-1 truncate">{form.handoverDocument.name}</span>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, handoverDocument: null })}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : form.handoverDocumentUrl ? (
                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3">
                          <Paperclip size={14} className="text-blue-600 shrink-0" />
                          <a href={form.handoverDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:underline flex-1">View attached document</a>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, handoverDocumentUrl: "" })}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-[#3b6dae]/50 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/50 transition-all duration-200 w-fit">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+ Attach handover document</span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setForm({ ...form, handoverDocument: e.target.files[0] });
                              }
                            }}
                          />
                        </label>
                      )}
                      {!form.handoverDocument && !form.handoverDocumentUrl && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5 ml-1">Required before submission</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </Section>

          {/* 3. EMPLOYEE SIGNATURE */}
          <Section title="3. EMPLOYEE SIGNATURE">
            <Row label="4.1 Your Signature">
              <div className="space-y-3 py-1 w-full">
                {effectiveIsReadOnly ? (
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
                        onClick={() => setForm({ ...form, signatureMethod: "draw", employeeSignature: null, employeeSignatureUrl: "" })}
                        className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                          form.signatureMethod === "draw"
                            ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                            : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"
                        } cursor-pointer`}
                      >
                        Draw
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, signatureMethod: "upload", employeeSignature: null, employeeSignatureUrl: "" })}
                        className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                          form.signatureMethod === "upload"
                            ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                            : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"
                        } cursor-pointer`}
                      >
                        Upload image
                      </button>
                    </div>

                    {form.signatureMethod === "upload" ? (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        {form.employeeSignatureUrl ? (
                          <div className="flex items-center gap-3 bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3">
                            <Paperclip size={14} className="text-blue-600 shrink-0" />
                            <span className="text-xs font-medium text-blue-800 dark:text-blue-200 flex-1 truncate">{form.employeeSignature?.name || "Signature image"}</span>
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, employeeSignature: null, employeeSignatureUrl: "" })}
                              className="text-red-500 hover:text-red-700 text-xs font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-[#3b6dae]/50 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/50 transition-all duration-200 w-fit">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+ Upload signature image</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  setForm({ ...form, employeeSignature: file });
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    setForm((prev) => ({
                                      ...prev,
                                      employeeSignatureUrl: ev.target?.result as string,
                                    }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <SignaturePad
                        onSave={(dataUrl) => {
                          const file = base64ToFile(dataUrl, "signature.png");
                          setForm({ ...form, employeeSignature: file, employeeSignatureUrl: dataUrl });
                        }}
                        onClear={() => {
                          setForm({ ...form, employeeSignature: null, employeeSignatureUrl: "" });
                        }}
                      />
                    )}

                    {form.employeeSignatureUrl && form.signatureMethod === "upload" && (
                      <div className="mt-2 animate-in zoom-in duration-300">
                        <img src={form.employeeSignatureUrl} alt="signature" className="h-16 object-contain" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </Row>

          </Section>

          {/* Draft-only: approval route preview (no section header) */}
          {!effectiveIsReadOnly && (() => {
            const empInitials = (user?.name || "Me").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            const managerFromHeads = heads.find((h: any) => h.id === Number(autoFillData?.managerId || form.reportingManager));
            const mgrName = managerFromHeads?.name || autoFillData?.managerName || "HOD";
            const mgrInitials = mgrName !== "HOD" ? mgrName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "HOD";
            return (
              <ApprovalRoutePreview steps={[
                { initials: empInitials, name: user?.name || "You", role: "Submitter", isSubmitter: true },
                { initials: mgrInitials, name: mgrName, role: "Line Manager / HOD" },
              ]} />
            );
          })()}

          {/* 4. APPROVER SIGNATURES — only for approver view and after resolution */}
          {(isApprover || requestData?.status === "approved" || requestData?.status === "rejected") && (
            <Section title="4. APPROVER SIGNATURES">
              {form.managerSignatureUrl && (requestData?.status === "approved" || requestData?.status === "rejected") && (() => {
                const hodApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "head_of_department");
                const hodName = savedFormData.data?.managerSignerName || hodApproval?.approver?.name || requestData?.initialApprover?.name || "Line Manager / HOD";
                return (
                  <Row label="4.1 HOD / Line Manager">
                    <div className="py-1">
                      <img src={form.managerSignatureUrl} alt="HOD Signature" className="h-10 object-contain" />
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">✓ {hodName}</p>
                    </div>
                  </Row>
                );
              })()}

              {requestData?.status === "rejected" && (
                <div className="p-4 border border-red-300 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-950/30 my-4 mx-4">
                  <div className="flex items-start gap-3">
                    <div className="text-red-600 dark:text-red-400 font-bold text-lg">✕</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">Request Rejected</h3>
                      <p className="text-xs text-red-600 dark:text-red-300">
                        {requestData?.rejectionReason || "This leave request has been rejected. Please contact your manager or HR for more information."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isApprover && requestData?.status !== "approved" && requestData?.status !== "rejected" && (
                <div className="border-t border-blue-200 dark:border-[#3b6dae]/40">
                  <Row label="4.2 Your Comment">
                    <div className="space-y-3 py-1 w-full">
                      <Textarea
                        value={approvalComments}
                        onChange={(e) => setApprovalComments(e.target.value)}
                        placeholder="Add your comments or observations here..."
                        className="min-h-20 text-xs border-blue-300 dark:border-[#3b6dae]/40 bg-white dark:bg-[#1a385c]"
                      />
                    </div>
                  </Row>
                  <Row label="4.3 Your Signature">
                    <div className="space-y-3 py-1 w-full">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setApproverSignatureMethod("draw"); setApproverSignature(null); setApproverSignatureUrl(""); }}
                          className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                            approverSignatureMethod === "draw"
                              ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                              : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"
                          } cursor-pointer`}
                        >
                          Draw
                        </button>
                        <button
                          type="button"
                          onClick={() => { setApproverSignatureMethod("upload"); setApproverSignature(null); setApproverSignatureUrl(""); }}
                          className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                            approverSignatureMethod === "upload"
                              ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                              : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"
                          } cursor-pointer`}
                        >
                          Upload image
                        </button>
                      </div>

                      {approverSignatureMethod === "upload" ? (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          {approverSignatureUrl ? (
                            <div className="flex items-center gap-3 bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3">
                              <Paperclip size={14} className="text-blue-600 shrink-0" />
                              <span className="text-xs font-medium text-blue-800 dark:text-blue-200 flex-1 truncate">{approverSignature?.name || "Signature image"}</span>
                              <button type="button" onClick={() => { setApproverSignature(null); setApproverSignatureUrl(""); }} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-[#3b6dae]/50 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/50 transition-all duration-200 w-fit">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+ Upload signature image</span>
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setApproverSignature(file);
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setApproverSignatureUrl(ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }} />
                            </label>
                          )}
                        </div>
                      ) : (
                        <SignaturePad 
                          onSave={(dataUrl) => {
                            const file = base64ToFile(dataUrl, "approver_signature.png");
                            setApproverSignature(file);
                            setApproverSignatureUrl(dataUrl);
                          }}
                          onClear={() => {
                            setApproverSignature(null);
                            setApproverSignatureUrl("");
                          }}
                        />
                      )}

                      {approverSignatureUrl && approverSignatureMethod === "upload" && (
                        <div className="mt-2 animate-in zoom-in duration-300">
                          <img src={approverSignatureUrl} alt="Signature Preview" className="h-10 object-contain" />
                        </div>
                      )}
                    </div>
                  </Row>
                </div>
              )}
            </Section>
          )}


          {/* 5. APPROVAL CHAIN (preview) */}
          {(effectiveIsReadOnly || requestData?.status === "pending" || requestData?.status === "approved" || requestData?.status === "rejected") && (
            <Section title="5. APPROVAL CHAIN (preview)">
              <div className="px-3 lg:px-4 py-3 lg:py-4">
                <ApprovalChainPreview
                  requestType="leave"
                  currentApprovalLevel={requestData?.currentApprovalLevel}
                  status={requestData?.status || "draft"}
                  approvals={requestData?.approvals || []}
                />
              </div>
            </Section>
          )}
        </div>

        {/* ===== ACTIONS ===== */}
        {( !effectiveIsReadOnly || (isApprover && requestData?.status !== "approved" && requestData?.status !== "rejected") ) && (
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center px-3 lg:px-6 py-3 lg:py-4 bg-gray-50 dark:bg-[#1a385c] gap-2 lg:gap-4">
            <div className="flex gap-2">
              {/* Print/Download options are only available for approved requests */}
            </div>
            <div className="flex flex-col lg:flex-row gap-2 w-full lg:justify-end">
              {isApprover ? (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowRejectDialog(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    Reject Request
                  </Button>
                  <Button disabled={isLoading || !approverSignature} onClick={() => { if (!approverSignature) { toast.error("Please provide your signature before approving"); return; } onApprove?.({ comments: approvalComments, signatureFile: approverSignature, selectedHR }); }} className="bg-green-600 hover:bg-green-700 disabled:opacity-50">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Approve
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    disabled={isSubmitting || !isEligible}
                    onClick={() => handleSubmit(false)}
                    className={`border-blue-400 dark:border-[#3b6dae]/50 ${!isEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Draft
                  </Button>
                  <Button
                    disabled={isSubmitting || !isEligible}
                    onClick={() => handleSubmit(true)}
                    className={`bg-blue-600 hover:bg-blue-700 ${!isEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {isApprover && (
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-[#1f426b]">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-red-600">Reject Request</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 dark:text-slate-300 mt-2">
                  Please provide a detailed reason for rejecting this request. This feedback will be shared with the requester.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2 block">Rejection Reason *</label>
                  <Textarea 
                    placeholder="Provide a reason for rejection..." 
                    value={rejectReason} 
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-24 text-sm border-red-300 focus:border-red-500 focus:ring-red-500 bg-white dark:bg-[#1a385c]"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{rejectReason.length}/500 characters</p>
                </div>
              </div>
              <DialogFooter className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectReason("");
                  }}
                  className="border-gray-300 dark:border-slate-600 text-foreground"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  disabled={rejectReason.trim().length < 1 || isLoading}
                  onClick={() => {
                    if (rejectReason.trim().length >= 1) {
                      onReject?.(rejectReason);
                      setRejectReason("");
                      setShowRejectDialog(false);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reject Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* ===== FOOTER ===== */}
        <div className="text-center text-[10px] text-gray-500 py-3 border-t border-gray-100 space-y-1">
          <p>www.centrika.rw</p>
          <p>© {new Date().getFullYear()} | Centrika Ltd | Delivering Tomorrow's Solutions Today</p>
        </div>
      </div>
    </div>
  );
}

/* ========= Helper Components ========= */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="lg:bg-[#3b6dae] lg:text-white font-bold px-4 py-2 text-sm">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-0">
      <div className="px-2 lg:px-3 py-1.5 lg:py-2 font-medium lg:bg-blue-100 text-blue-700 text-[10px] lg:text-xs lg:whitespace-nowrap">
        {label}
      </div>
      <div className="px-2 lg:px-3 py-1 text-xs lg:text-sm">{children}</div>
    </div>
  );
}
