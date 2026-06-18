"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Eye, AlertCircle, User, Building2, Paperclip } from "lucide-react";
import ApprovalChainPreview from "@/components/forms/ApprovalChainPreview";
import { ApprovalRoutePreview } from "@/components/forms/ApprovalRoutePreview";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";
import DateRangePicker from "@/components/DateRangePicker";
import { getLeaveTypeConfig } from "@/lib/leaveTypeConfig";
import { LeaveBalanceCalculator } from "./shared/LeaveBalanceCalculator";
import { SignaturePad } from "@/components/SignaturePad";
import { base64ToFile, fileToBase64 } from "@/lib/fileUtils";
import { exportFormToPdf, getActiveFormElement, printFormElement } from "@/lib/formExport";
import { isNonWorkingDay, calculateWorkingDays } from "@/utils/leaveCalculator";

/** Add N business days (skipping weekends + Rwandan holidays) to a date string */
function addBusinessDays(startDateStr: string, days: number): string {
  if (!startDateStr) return "";
  const date = new Date(startDateStr + "T00:00:00Z");
  let added = 0;
  // The start date itself counts as day 1 if it's a working day
  while (added < days - 1) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (!isNonWorkingDay(date)) added++;
  }
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

interface LeaveRequestFormProps {
  requestId?: number;
  requestData?: any;
  isApprover?: boolean;
  isReadOnly?: boolean;
  onApprove?: (data: any) => void;
  onReject?: (reason: string) => void;
  isLoading?: boolean;
  onSuccess?: () => void;
  leaveType?: string;
}

export default function LeaveRequestForm({
  requestId,
  requestData,
  isApprover: propsIsApprover,
  isReadOnly = false,
  onApprove,
  onReject,
  isLoading = false,
  onSuccess,
  leaveType: initialLeaveType,
}: LeaveRequestFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [takenLeaveDates, setTakenLeaveDates] = useState<string[]>([]);
  const [isEligible, setIsEligible] = useState(true);

  const autoFillData = useFormAutoFill();

  const [form, setForm] = useState({
    employeeName: "",
    staffId: "",
    department: "",
    position: "",
    workEmail: "",
    dateOfEmployment: "",
    reportingManager: "",
    leaveType: "annual" as "annual" | "sick" | "parental" | "personal" | "unpaid",
    parentalLeaveType: "" as "paternity" | "maternity" | "",
    startDate: "",
    endDate: "",
    leaveDaysEntitled: 0,
    leaveDaysTaken: "0",
    leaveDaysRequested: 0,
    leaveDaysRemaining: 0,
    outsideCountry: "no" as "yes" | "no",
    contactDuringLeave: "",
    backupPersonId: "",
    backupPersonName: "",
    backupPersonPhone: "",
    supportingDocument: null as File | null,
    supportingDocumentUrl: "",
    employeeSignature: null as File | null,
    employeeSignatureUrl: "",
    signatureDate: "",
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    documentId: "",
    managerSignatureUrl: "",
    signatureMethod: "draw" as "upload" | "draw",
    handoverPersonId: "",
    handoverPersonEmail: "",
    handoverPersonPosition: "",
    handoverPersonDepartment: "",
    handoverResponsibilities: "",
    handoverDocument: null as File | null,
    handoverDocumentUrl: "",
  });

  const [approvalComments, setApprovalComments] = useState("");
  const [approverSignature, setApproverSignature] = useState<File | null>(null);
  const [approverSignatureUrl, setApproverSignatureUrl] = useState("");
  const [approverSignatureMethod, setApproverSignatureMethod] = useState<"upload" | "draw">("draw");
  const [approverSignatureFileId, setApproverSignatureFileId] = useState<number | null>(null);
  const [selectedHR, setSelectedHR] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrintingForm, setIsPrintingForm] = useState(false);

  const headsOfDept = trpc.users.listHeads.useQuery();
  const hrUsers = trpc.users.getHRUsers.useQuery();
  const staffForBackup = (trpc as any).users.listStaffForBackup.useQuery();

  // Fetch the saved form JSON blob for approver/read-only views OR when editing draft forms
  const savedFormData = (trpc as any).requests.getLeaveFormData.useQuery(
    { requestId: requestData?.id || requestId || 0 },
    { enabled: !!(requestData?.id || requestId) && (isReadOnly || !!onApprove || !!onReject || requestData?.status === "draft") }
  );

  // Resolve parental leave to maternity/paternity based on the employee's gender
  // For approver views, use the employee's gender from requestData, not the approver's
  const resolvedLeaveType = (() => {
    if (form.leaveType === "parental") {
      // 1. If the saved form data already has a resolved type, use it
      if (savedFormData?.data?.resolvedLeaveType) return savedFormData.data.resolvedLeaveType;
      if (form.parentalLeaveType) return form.parentalLeaveType;
      // 2. Use the employee's gender from requestData (for approver views)
      const employeeGender = requestData?.user?.gender?.toLowerCase() || (user as any)?.gender?.toLowerCase();
      if (employeeGender === "female") return "maternity";
      if (employeeGender === "male") return "paternity";
    }
    return form.leaveType;
  })();

  const isApprover = propsIsApprover !== undefined ? propsIsApprover : (!!onApprove || !!onReject);
  const effectiveIsReadOnly = isReadOnly || isApprover;

  useEffect(() => {
    if (requestData) {
      const lr = requestData.leaveRequest;
      setForm((prev: any) => ({
        ...prev,
        employeeName: requestData.user?.name || requestData.employee?.name || prev.employeeName,
        staffId: requestData.user?.staffId || requestData.employee?.staffId || prev.staffId,
        department: requestData.user?.department?.name || requestData.employee?.department || prev.department,
        position: requestData.user?.position || requestData.employee?.position || prev.position,
        leaveType: lr?.leaveType || (requestData.type === "leave" ? (requestData.leaveType || prev.leaveType) : prev.leaveType),
        managerSignatureUrl: requestData.managerSignatureUrl || prev.managerSignatureUrl,
        startDate: lr?.startDate || prev.startDate,
        endDate: lr?.endDate || prev.endDate,
        leaveDaysRequested: lr?.leaveDaysRequested || prev.leaveDaysRequested,
        leaveDaysEntitled: lr?.leaveDaysEntitled || prev.leaveDaysEntitled,
        leaveDaysTaken: lr?.leaveDaysTaken || prev.leaveDaysTaken,
        leaveDaysRemaining: lr?.leaveDaysRemaining || prev.leaveDaysRemaining,
        contactDuringLeave: lr?.reason || prev.contactDuringLeave,
        reportingManager: requestData.initialApproverId ? String(requestData.initialApproverId) : prev.reportingManager,
        dateOfEmployment: requestData.user?.dateOfEmployment || prev.dateOfEmployment,
        // Handover fields from the LeaveRequest DB record
        backupPersonName: lr?.backupPersonName || prev.backupPersonName,
        backupPersonPhone: lr?.backupPersonPhone || prev.backupPersonPhone,
        backupPersonId: lr?.handoverPersonId ? String(lr.handoverPersonId) : prev.backupPersonId,
        handoverPersonId: lr?.handoverPersonId ? String(lr.handoverPersonId) : prev.handoverPersonId,
        handoverPersonEmail: lr?.handoverPersonEmail || prev.handoverPersonEmail,
        handoverResponsibilities: lr?.handoverResponsibilities || prev.handoverResponsibilities,
      }));
    } else if (user && !requestId) {
      const deptName = typeof user.department === 'object' ? user.department?.name : (user.department || "");
      const sequence = String(Math.floor(Math.random() * 10000)).padStart(5, "0");
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
      const docId = `LR-${new Date().getFullYear()}-${currentMonth}-${sequence}`;

      setForm((prev: any) => ({
        ...prev,
        documentId: docId,
        employeeName: user.name || "",
        staffId: user.staffId || "",
        department: deptName || "",
        position: user.position || "",
        workEmail: user.email || "",
        dateOfEmployment: user.dateOfEmployment || "",
        reportingManager: autoFillData.managerId ? String(autoFillData.managerId) : "",
        leaveType: initialLeaveType || prev.leaveType,
      }));
    }
  }, [user, requestId, initialLeaveType, requestData, autoFillData.managerId]);

  // Merge saved form JSON (employee signature, contact details, etc.) when available
  useEffect(() => {
    if (savedFormData.data) {
      const d = savedFormData.data;
      setForm((prev: any) => ({
        ...prev,
        ...d, // Spread all saved data first
        // Then explicitly set file/signature fields that can't be serialized
        employeeSignature: null, // Don't restore file objects
        supportingDocument: null,
      }));
    }
  }, [savedFormData.data]);

  // Auto-calculate end date whenever start date or leave type changes for sick / parental leaves
  useEffect(() => {
    const isSick = form.leaveType === "sick";
    const isParental = form.leaveType === "parental";
    
    if ((isSick || isParental) && form.startDate) {
      let autoEnd = "";
      if (isSick) {
        autoEnd = addBusinessDays(form.startDate, 5);
      } else if (isParental) {
        if (resolvedLeaveType === "maternity") {
          autoEnd = addBusinessDays(form.startDate, 84);
        } else if (resolvedLeaveType === "paternity") {
          autoEnd = addBusinessDays(form.startDate, 7);
        }
      }
      
      if (autoEnd && autoEnd !== form.endDate) {
        setForm(prev => ({ ...prev, endDate: autoEnd }));
      }
    } else if ((isSick || isParental) && !form.startDate) {
      if (form.endDate !== "") {
        setForm(prev => ({ ...prev, endDate: "" }));
      }
    }
  }, [form.startDate, form.leaveType, resolvedLeaveType]);

  const validate = () => {
    if (form.leaveType === "annual" && !isEligible) {
      toast.error("You must be employed for at least one year to apply for Annual Leave.");
      return false;
    }
    const isSick = form.leaveType === "sick";
    const isParental = form.leaveType === "parental";

    if (isSick || isParental) {
      if (!form.startDate) {
        toast.error("Start date is required");
        return false;
      }
      if (!form.endDate) {
        toast.error("End date could not be calculated. Please re-select the start date.");
        return false;
      }
    } else {
      if (!form.startDate || !form.endDate) {
        toast.error("Start and end dates are required");
        return false;
      }
      if (form.endDate < form.startDate) {
        toast.error("End date must be after start date");
        return false;
      }
    }
    if (!form.leaveDaysRequested || form.leaveDaysRequested <= 0) {
      toast.error("Requested days must be greater than 0. Please check dates.");
      return false;
    }
    if (!form.backupPersonId) {
      toast.error("Please select a backup/cover person");
      return false;
    }
    if (!form.handoverResponsibilities?.trim()) {
      toast.error("Please describe the responsibilities being handed over");
      return false;
    }
    const remaining = Number(form.leaveDaysRemaining);
    if (!isNaN(remaining) && remaining < 0 && form.leaveType !== "unpaid") {
      toast.error("You do not have enough leave balance for this request");
      return false;
    }
    return true;
  };

  const uniqueHeads = headsOfDept.data || [];
  const uniqueHR = hrUsers.data || [];

  const isParental = form.leaveType === "parental" || resolvedLeaveType === "maternity" || resolvedLeaveType === "paternity";
  const isSick = form.leaveType === "sick";
  const isSingleDateSelection = isSick || isParental;

  const calculatedDays = calculateWorkingDays(form.startDate, form.endDate);

  const gender = requestData?.user?.gender?.toLowerCase() || (user as any)?.gender?.toLowerCase();
  const parentalDays = (resolvedLeaveType === "maternity" || (form.leaveType === "parental" && gender === "female")) ? 84 : 7;

  const config = getLeaveTypeConfig(resolvedLeaveType);
  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    pink: "bg-pink-500",
    cyan: "bg-cyan-500",
    green: "bg-green-500",
    gray: "bg-gray-50 dark:bg-[#1a385c]"
  };
  const titleBarColor = colorMap[config.color] || "bg-yellow-500";



  const createLeave = trpc.requests.createLeaveRequest.useMutation();
  const updateLeave = (trpc as any).requests.updateLeaveRequest.useMutation();
  const submitRequestMutation = trpc.requests.submitRequest.useMutation();
  const storeFormData = (trpc as any).requests.storeLeaveFormData.useMutation();
  const uploadAttachment = (trpc as any).requests.uploadAttachment.useMutation();

  const handlePrint = () => {
    const formElement = getActiveFormElement();
    if (!formElement) {
      toast.error("Form content not found for printing");
      return;
    }
    try {
      setIsPrintingForm(true);
      printFormElement({
        element: formElement,
        title: `${(config.title || "Leave Request").replace(/\s+/g, " ").trim()} - ${form.documentId || "Document"}`,
      });
    } catch {
      toast.error("Unable to open print view");
    } finally {
      setIsPrintingForm(false);
    }
  };

  const handleDownloadPdf = async () => {
    const formElement = getActiveFormElement();
    if (!formElement) {
      toast.error("Form content not found for export");
      return;
    }
    try {
      setIsExportingPdf(true);
      await exportFormToPdf({
        element: formElement,
        fileName: `${(config.title || "leave-request").toLowerCase().replace(/\s+/g, "-")}-${form.documentId || Date.now()}.pdf`,
      });
      toast.success("PDF downloaded successfully");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (form.leaveType === "annual" && !isEligible) {
      toast.error("You must be employed for at least one year to apply for Annual Leave.");
      return;
    }
    setIsSubmitting(true);
    try {
      // Check if we're updating an existing draft request
      const isEditing = requestData?.id && requestData?.status === "draft";
      
      const payload = {
        title: `${config.title || "Leave"} Request - ${form.documentId}`,
        leaveType: form.leaveType as any,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.contactDuringLeave,
        leaveDaysEntitled: Number(form.leaveDaysEntitled) || 0,
        leaveDaysTaken: Number(form.leaveDaysTaken) || 0,
        leaveDaysRequested: Number(form.leaveDaysRequested) || 0,
        backupPersonName: form.backupPersonName || undefined,
        backupPersonPhone: form.backupPersonPhone || undefined,
        handoverPersonId: form.backupPersonId ? parseInt(form.backupPersonId) : undefined,
        handoverPersonEmail: form.handoverPersonEmail || undefined,
        handoverResponsibilities: form.handoverResponsibilities || undefined,
      };

      let requestId: number;
      if (isEditing) {
        // Update existing draft
        await updateLeave.mutateAsync({
          requestId: requestData.id,
          ...payload,
        });
        requestId = requestData.id;
      } else {
        // Create new draft
        const created = await createLeave.mutateAsync(payload);
        requestId = (created as any)?.id as number;
      }

      if (requestId) {
        let finalSupportingDocUrl = form.supportingDocumentUrl;
        
        // Handle file upload if a new file is selected
        if (form.supportingDocument) {
          try {
            const base64 = await fileToBase64(form.supportingDocument);
            const uploadResult = await uploadAttachment.mutateAsync({
              requestId: requestId,
              fileName: form.supportingDocument.name,
              fileData: base64,
              mimeType: form.supportingDocument.type,
              attachmentType: "supporting_document",
            });
            finalSupportingDocUrl = uploadResult.fileUrl;
          } catch (e) {
            console.error("Failed to upload supporting document", e);
            toast.error("Draft saved, but failed to upload attachment");
          }
        }

        // Store the full form data JSON for draft forms too
        try {
          await storeFormData.mutateAsync({
            requestId: requestId,
            formData: {
              ...form,
              resolvedLeaveType,
              parentalLeaveType: form.leaveType === "parental" ? (resolvedLeaveType === "maternity" ? "maternity" : "paternity") : "",
              employeeSignature: undefined, // Can't serialize File objects
              supportingDocument: undefined,
              supportingDocumentUrl: finalSupportingDocUrl,
            },
          });
        } catch (e) {
          console.error("Failed to store form data", e);
        }
      }

      toast.success("Draft saved successfully");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (form.leaveType === "annual" && !isEligible) {
      toast.error("You must be employed for at least one year to apply for Annual Leave.");
      return;
    }
    if (!validate()) return;
    if (!form.reportingManager) {
      toast.error("Please select a Line Manager / HOD");
      return;
    }
    setIsSubmitting(true);
    try {
      // Check if we're updating an existing draft request
      const isEditing = requestData?.id && requestData?.status === "draft";
      
      const payload = {
        title: `${config.title || "Leave"} Request - ${form.documentId}`,
        leaveType: form.leaveType as any,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.contactDuringLeave,
        leaveDaysEntitled: Number(form.leaveDaysEntitled) || 0,
        leaveDaysTaken: Number(form.leaveDaysTaken) || 0,
        leaveDaysRequested: Number(form.leaveDaysRequested) || 0,
        backupPersonName: form.backupPersonName || undefined,
        backupPersonPhone: form.backupPersonPhone || undefined,
        handoverPersonId: form.backupPersonId ? parseInt(form.backupPersonId) : undefined,
        handoverPersonEmail: form.handoverPersonEmail || undefined,
        handoverResponsibilities: form.handoverResponsibilities || undefined,
      };

      let requestId: number;
      if (isEditing) {
        // Update existing draft
        await updateLeave.mutateAsync({
          requestId: requestData.id,
          ...payload,
        });
        requestId = requestData.id;
      } else {
        // Create new request
        const created = await createLeave.mutateAsync(payload);
        requestId = (created as any)?.id as number;
      }

      if (requestId) {
        let finalSupportingDocUrl = form.supportingDocumentUrl;
        
        // Handle file upload if a new file is selected
        if (form.supportingDocument) {
          try {
            const base64 = await fileToBase64(form.supportingDocument);
            const uploadResult = await uploadAttachment.mutateAsync({
              requestId: requestId,
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

        await submitRequestMutation.mutateAsync({
          id: requestId,
          initialApproverId: parseInt(form.reportingManager),
        });

        // Store the full form data JSON so the approver can see the complete form
        try {
          await storeFormData.mutateAsync({
            requestId: requestId,
            formData: {
              ...form,
              resolvedLeaveType,
              parentalLeaveType: form.leaveType === "parental" ? (resolvedLeaveType === "maternity" ? "maternity" : "paternity") : "",
              employeeSignature: undefined, // Can't serialize File objects
              supportingDocument: undefined,
              supportingDocumentUrl: finalSupportingDocUrl,
            },
          });
        } catch (e) {
          console.error("Failed to store form data", e);
        }
      }

      toast.success("🎉 Leave request successfully submitted!");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
      <div className="w-full bg-white dark:bg-[#1f426b] text-black dark:text-slate-100 px-3 md:px-4 leave-form-container relative dark:border-[#2b6cb0]/30">
      <div>
        {/* HEADER WITH LOGO AND CONTACT INFO */}
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
        </div>        {/* TITLE BAR (YELLOW AS REQUESTED) */}
        <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide uppercase">
          {config.title || "LEAVE REQUEST FORM"}
        </div>

        {/* ELIGIBILITY WARNING BANNER — only shown to the employee creating the form, never to approvers */}
        {form.leaveType === "annual" && !isEligible && !effectiveIsReadOnly && (
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

        {/* REQUEST HEADER SECTION (hidden — kept for future use) =====
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-3 px-3 lg:px-6 py-2 lg:py-3 text-xs lg:text-sm items-end">
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-[10px] lg:text-xs">CTK</p>
            <div className="flex gap-0 items-center">
              <Input value={form.department} className="w-full h-6 lg:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] lg:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed border-l-0" disabled />
            </div>
          </div>
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-[10px] lg:text-xs">Date of Request</p>
            <Input type="text" value={new Date().toISOString().split('T')[0]} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Staff ID</p>
            <Input value={form.staffId} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Employee Name</p>
            <Input value={form.employeeName} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
          </div>
        </div>
        ===== */}

        {/* REQUEST DETAILS */}
        <div className="">
          <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

          {/* 1. EMPLOYEE INFORMATION */}
          <Section title="1. EMPLOYEE INFORMATION">
            <Row label="1.1 Request Number">
              <Input value={form.documentId} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.2 Employee Full Name">
              <Input value={form.employeeName} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.3 Department">
              <Input value={form.department} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.4 Employee / Staff ID">
              <Input value={form.staffId} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.5 Position / Title">
              <Input value={form.position} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.6 Date of Employment">
              <Input type="date" value={form.dateOfEmployment} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.7 Work Email">
              <Input value={form.workEmail} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
          </Section>

          {/* 2. LEAVE DETAILS */}
          <Section title="2. LEAVE DETAILS">
            <Row label="2.1 Nature of Leave">
              <Input
                value={config.title || "Annual Leave"}
                className="w-full h-8 border-blue-300 text-[10px] dark:border-[#3b6dae]/40 bg-gray-100 dark:bg-[#295482] text-black dark:text-slate-100 font-medium cursor-not-allowed"
                disabled
              />
            </Row>
            <Row label="2.2 Leave Duration (Start – End)">
              <DateRangePicker
                startDate={form.startDate}
                endDate={form.endDate}
                onStartDateChange={(d: string) => setForm({ ...form, startDate: d })}
                onEndDateChange={(d: string) => setForm({ ...form, endDate: d })}
                disabled={effectiveIsReadOnly}
                maxDays={200}
                takenLeaveDates={takenLeaveDates}
                isFixedDuration={isSingleDateSelection}
              />
            </Row>

            <div className="px-4 pb-4">
              <LeaveBalanceCalculator
                leaveType={resolvedLeaveType}
                startDate={form.startDate}
                endDate={form.endDate}
                alreadyTaken={parseInt(form.leaveDaysTaken) || 0}
                onTakenChange={(val) => setForm(prev => ({ ...prev, leaveDaysTaken: val.toString() }))}
                onCalculated={(data: any) => {
                  if (
                    form.leaveDaysRequested !== data.requested ||
                    form.leaveDaysRemaining !== data.remaining ||
                    form.leaveDaysEntitled !== data.entitled ||
                    form.leaveDaysTaken !== data.taken.toString()
                  ) {
                    setForm(prev => ({
                      ...prev,
                      leaveDaysRequested: data.requested,
                      leaveDaysRemaining: typeof data.remaining === "number" ? data.remaining : 999,
                      leaveDaysEntitled: typeof data.entitled === "number" ? data.entitled : 999,
                      leaveDaysTaken: data.taken.toString()
                    }));
                  }
                  // Update taken leave dates from backend
                  if (data.takenLeaveDates) {
                    setTakenLeaveDates(data.takenLeaveDates);
                  }
                  if (data.isEligible !== undefined && data.isEligible !== isEligible) {
                    setIsEligible(data.isEligible);
                  }
                }}
                readOnlyData={effectiveIsReadOnly ? {
                  entitled: Number(form.leaveDaysEntitled) || (resolvedLeaveType === "unpaid" ? "Unlimited" as const : 0),
                  taken: parseInt(form.leaveDaysTaken) || 0,
                  requested: Number(form.leaveDaysRequested) || 0,
                  remaining: resolvedLeaveType === "unpaid" ? "Unlimited" as const : (Number(form.leaveDaysRemaining) || 0),
                  isEligible: true,
                } : undefined}
              />
            </div>

            <Row label="2.3 Business Days Requested">
              <div className="flex items-center gap-2">
                <Input value={calculatedDays} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs w-24 bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 w-full  font-medium text-center" />
                <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Day(s)</span>
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
                      {form.backupPersonName ? (
                        <div className="bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-blue-600 shrink-0" />
                            <span className="text-xs font-bold text-blue-800 dark:text-blue-200">{form.backupPersonName}</span>
                          </div>
                          {form.backupPersonPhone && (
                            <div className="flex items-center gap-2">
                              <Phone size={12} className="text-blue-500 shrink-0" />
                              <span className="text-xs text-blue-700 dark:text-blue-300">{form.backupPersonPhone}</span>
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
                    <div>
                      <label className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1 block">Cover Person *</label>
                      <Select
                        value={form.backupPersonId}
                        onValueChange={(val) => {
                          const selectedStaff = staffForBackup.data?.find((s: any) => String(s.id) === val);
                          setForm({
                            ...form,
                            backupPersonId: val,
                            backupPersonName: selectedStaff?.name || "",
                            backupPersonPhone: selectedStaff?.phoneNumber || "",
                            handoverPersonId: val,
                            handoverPersonEmail: selectedStaff?.email || "",
                            handoverPersonPosition: selectedStaff?.position || "",
                            handoverPersonDepartment: selectedStaff?.department?.name || selectedStaff?.department || "",
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
                                    {s.department?.name || s.department}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {form.backupPersonId && (
                      <div className="bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3 space-y-1.5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-blue-600 shrink-0" />
                          <span className="text-xs font-bold text-blue-800 dark:text-blue-200">{form.backupPersonName}</span>
                        </div>
                        {form.backupPersonPhone && (
                          <div className="flex items-center gap-2">
                            <Phone size={12} className="text-blue-500 shrink-0" />
                            <span className="text-xs text-blue-700 dark:text-blue-300">{form.backupPersonPhone}</span>
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
                        {!form.backupPersonPhone && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 italic">No phone number on file for this staff member</p>
                        )}
                      </div>
                    )}
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
                          <button type="button" onClick={() => setForm({ ...form, handoverDocument: null })} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                        </div>
                      ) : form.handoverDocumentUrl ? (
                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3">
                          <Paperclip size={14} className="text-blue-600 shrink-0" />
                          <a href={form.handoverDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:underline flex-1">View attached document</a>
                          <button type="button" onClick={() => setForm({ ...form, handoverDocumentUrl: "" })} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-[#3b6dae]/50 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/50 transition-all duration-200 w-fit">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+ Attach handover document</span>
                          <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={(e) => { if (e.target.files?.[0]) { setForm({ ...form, handoverDocument: e.target.files[0] }); } }} />
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

          {/* Continuing LEAVE DETAILS for remaining fields */}
          <Section title="2. LEAVE DETAILS (CONT.)">
            <Row label="2.4 Will you be outside the country?">
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

          {/* 3. SIGNATURE & SUPPORTING DOCS */}
          <Section title="3. SIGNATURE & SUPPORTING DOCS">
            {config.requiresSupportingDoc && (
              <Row label="3.2 Supporting Document">
                <div className="space-y-2">
                  {!effectiveIsReadOnly && (
                    form.supportingDocument ? (
                      <div className="flex items-center gap-3 bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3">
                        <Paperclip size={14} className="text-blue-600 shrink-0" />
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-200 flex-1 truncate">{form.supportingDocument.name}</span>
                        <button type="button" onClick={() => setForm({ ...form, supportingDocument: null })} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-[#3b6dae]/50 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/50 transition-all duration-200 w-fit">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+ Attach supporting document</span>
                        <input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { setForm({ ...form, supportingDocument: e.target.files[0] }); } }} />
                      </label>
                    )
                  )}
                  {form.supportingDocumentUrl && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-blue-600 font-medium">Attached: Document</p>
                      <a href={form.supportingDocumentUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-7 py-0 px-2 text-[10px] border-blue-200">
                          <Eye size={12} className="mr-1" />
                          View
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </Row>
            )}

            <Row label={`${config.requiresSupportingDoc ? "3.3" : "3.2"} Employee Signature`}>
              <div className="space-y-3">
                {!effectiveIsReadOnly ? (
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
                            <button type="button" onClick={() => setForm({ ...form, employeeSignature: null, employeeSignatureUrl: "" })} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-[#3b6dae]/50 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/50 transition-all duration-200 w-fit">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+ Upload signature image</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                setForm({ ...form, employeeSignature: file });
                                const reader = new FileReader();
                                reader.onload = (ev) => setForm((prev: any) => ({ ...prev, employeeSignatureUrl: ev.target?.result as string }));
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
                          setForm({ ...form, employeeSignature: file, employeeSignatureUrl: dataUrl });
                        }}
                        onClear={() => {
                          setForm({ ...form, employeeSignature: null, employeeSignatureUrl: "" });
                        }}
                      />
                    )}
                    
                    {form.employeeSignatureUrl && form.signatureMethod === "upload" && (
                       <div className="mt-2 animate-in zoom-in duration-300">
                          <img src={form.employeeSignatureUrl} alt="sig" className="h-16 w-full md:w-auto object-contain" />
                       </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-1">
                    {form.employeeSignatureUrl ? (
                      <>
                        <img src={form.employeeSignatureUrl} alt="sig" className="h-16 object-contain" />
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{form.employeeName || requestData?.user?.name || ""}</p>
                      </>
                    ) : (
                      <p className="text-xs italic text-gray-500">No signature</p>
                    )}
                  </div>
                )}

              </div>
            </Row>
          </Section>

          {/* Draft-only: approval route preview (no section header) */}
          {!isReadOnly && !isApprover && (() => {
            const empInitials = (user?.name || "Me").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            const managerFromHeads = headsOfDept.data?.find((h: any) => h.id === Number(autoFillData?.managerId || form.reportingManager));
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
            {/* Approved/rejected: show actual HOD signature only */}
            {form.managerSignatureUrl && (requestData?.status === "approved" || requestData?.status === "rejected") && (() => {
              const hodApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "head_of_department");
              const hodName = savedFormData.data?.managerSignerName || hodApproval?.approver?.name || requestData?.initialApprover?.name || "Line Manager / HOD";
              return (
                <Row label="4.1 HOD / Line Manager">
                  <div className="py-1">
                    <img src={form.managerSignatureUrl} alt="Manager Signature" className="h-10 object-contain" />
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">✓ {hodName}</p>
                  </div>
                </Row>
              );
            })()}

            {requestData?.status === "rejected" && (
              <div className="p-4 border border-red-300 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-950/30 mb-4">
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
                <Row label="5.2 Your Comment">
                  <div className="space-y-3 py-1 w-full">
                    <Textarea
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Add your comments or observations here..."
                      className="min-h-20 text-xs border-blue-300 dark:border-[#3b6dae]/40 bg-white dark:bg-[#1a385c]"
                    />
                  </div>
                </Row>
                <Row label="5.3 Your Signature">
                  <div className="space-y-3 py-1 w-full">
                    {!isReadOnly ? (
                      <>
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
                      </>
                    ) : (
                      <p className="text-xs italic text-gray-500">Signature on file</p>
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

        {/* ACTIONS & FOOTER */}
        <div className="no-print flex flex-col lg:flex-row justify-between items-stretch lg:items-center px-3 md:px-6 py-4 bg-gray-50 dark:bg-[#1a385c] gap-3 md:gap-4 mt-4">
          {requestData?.status === "approved" && (
            <div className="flex flex-col lg:flex-row gap-2 w-full lg:justify-end">
              <Button variant="outline" disabled={isSubmitting || isPrintingForm} onClick={handlePrint} className="border-blue-400 dark:border-[#3b6dae]/50 text-blue-600">
                {(isSubmitting || isPrintingForm) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Printer size={16} className="mr-1" /> Print Form
              </Button>
              <Button 
                variant="outline" 
                disabled={isSubmitting || isExportingPdf}
                onClick={handleDownloadPdf}
                className="border-blue-400 dark:border-[#3b6dae]/50 text-blue-600"
              >
                {(isSubmitting || isExportingPdf) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Download size={16} className="mr-1" /> Download PDF
              </Button>
            </div>
          )}
          {requestData?.status !== "approved" && (
            <div className="flex flex-col lg:flex-row gap-2 w-full lg:justify-end">
              {isApprover && !isReadOnly && requestData?.status !== "rejected" && (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowRejectDialog(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    Reject Request
                  </Button>
                  <Button disabled={isLoading} onClick={() => onApprove?.({ comments: approvalComments, signatureFile: approverSignature, selectedHR })} className="bg-green-600 hover:bg-green-700">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Approve
                  </Button>
                </>
              )}

              {!isApprover && !isReadOnly && requestData?.status !== "rejected" && (
                <>
                  <Button
                    variant="outline"
                    disabled={isSubmitting || (form.leaveType === "annual" && !isEligible)}
                    onClick={handleSaveAsDraft}
                    className={`border-blue-400 dark:border-[#3b6dae]/50 ${(form.leaveType === "annual" && !isEligible) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Save Draft
                  </Button>
                  <Button
                    disabled={isSubmitting || (form.leaveType === "annual" && !isEligible)}
                    onClick={handleSubmit}
                    className={`bg-blue-600 hover:bg-blue-700 ${(form.leaveType === "annual" && !isEligible) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-600 dark:text-slate-400 py-3 border-t border-gray-200 space-y-1">
          <p>www.centrika.rw</p>
          <p>1 | Centrika Ltd | Motto: Delivering Tomorrow's Solutions Today</p>
        </div>
      </div>

      {isApprover && (
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-red-600">Reject Request</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                Please provide a detailed reason for rejecting this request. This feedback will be shared with the requester.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Rejection Reason *</label>
                <Textarea 
                  placeholder="Provide a reason for rejection..." 
                  value={rejectReason} 
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="min-h-24 text-sm border-red-300 focus:border-red-500 focus:ring-red-500"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{rejectReason.length}/500 characters</p>
              </div>
            </div>
            <DialogFooter className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason("");
                }}
                className="border-gray-300"
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
    </div>
  );
}

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
      <div className="px-2 lg:px-3 py-1.5 lg:py-2 font-medium lg:bg-blue-100 text-[#3b6dae] text-[10px] lg:text-xs lg:whitespace-nowrap">{label}</div>
      <div className="px-2 lg:px-3 py-1 lg:py-1  text-xs lg:text-sm">{children}</div>
    </div>
  );
}
