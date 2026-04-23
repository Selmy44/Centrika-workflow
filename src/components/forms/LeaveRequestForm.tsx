"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Eye } from "lucide-react";
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
import SingleDatePicker from "@/components/SingleDatePicker";
import { getLeaveTypeConfig } from "@/lib/leaveTypeConfig";
import { LeaveBalanceCalculator } from "./shared/LeaveBalanceCalculator";
import { SignaturePad } from "@/components/SignaturePad";
import { base64ToFile, fileToBase64 } from "@/lib/fileUtils";
import { exportFormToPdf, getActiveFormElement, printFormElement } from "@/lib/formExport";

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

  const autoFillData = useFormAutoFill();

  const [form, setForm] = useState({
    employeeName: "",
    staffId: "",
    department: "",
    position: "",
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

  const validate = () => {
    if (!form.startDate || !form.endDate) {
      toast.error("Start and end dates are required");
      return false;
    }
    if (form.endDate < form.startDate) {
      toast.error("End date must be after start date");
      return false;
    }
    if (!form.leaveDaysRequested || form.leaveDaysRequested <= 0) {
      toast.error("Requested days must be greater than 0. Please check dates.");
      return false;
    }
    if (!form.backupPersonId) {
      toast.error("Please select a backup person");
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

  const calculateBusinessDays = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  const calculatedBusinessDays = calculateBusinessDays(form.startDate, form.endDate);

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
        <div className="flex flex-col md:flex-row md:justify-between md:items-start px-3 md:px-6 py-3 gap-4 md:gap-8">
          <div className="shrink-0">
            <img src="/logo/centrikaLogo.png" alt="Centrika Logo" className="h-14 md:h-20 w-auto" />
          </div>
          <div className="text-xs md:text-sm flex-1 flex justify-start md:justify-end">
            <div className="flex flex-col gap-2 md:gap-3 items-start">
              <div className="flex items-center gap-2 min-w-0">
                <Phone size={14} className="text-blue-600 shrink-0 md:w-[16px] md:h-[16px]" />
                <span className="text-blue-600 font-semibold truncate text-[11px] md:text-sm">+250 788 123 099</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Mail size={14} className="text-blue-600 shrink-0 md:w-[16px] md:h-[16px]" />
                <span className="text-blue-600 font-semibold truncate text-[11px] md:text-sm">info@centrika.rw</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Globe size={14} className="text-blue-600 shrink-0 md:w-[16px] md:h-[16px]" />
                <span className="text-blue-600 font-semibold truncate text-[11px] md:text-sm">www.centrika.rw</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5 md:w-[16px] md:h-[16px]" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-blue-600 font-semibold text-[10px] md:text-sm leading-tight">Room F002, 2nd Floor, CHIC Building,</span>
                  <span className="text-blue-600 font-semibold text-[10px] md:text-sm leading-tight">Plot 1007, KN2 Kigali-Rwanda</span>
                </div>
              </div>
            </div>
          </div>
        </div>        {/* TITLE BAR (YELLOW AS REQUESTED) */}
        <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide uppercase">
          {config.title || "LEAVE REQUEST FORM"}
        </div>

        {/* REQUEST HEADER SECTION - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm items-end">
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-[10px] md:text-xs">Department</p>
            <div className="flex gap-0 items-center">
              <span className="text-blue-600 font-bold text-[10px] md:text-xs whitespace-nowrap">CTK - </span>
              <Input value={form.department} className="w-full h-6 md:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] md:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed border-l-0" disabled />
            </div>
          </div>
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-[10px] md:text-xs">Date of Request</p>
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

        {/* REQUEST DETAILS */}
        <div className="border-t border-blue-400 dark:border-[#3b6dae]/50">
          <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

          {/* 1. EMPLOYEE INFORMATION */}
          <Section title="1. EMPLOYEE INFORMATION">
            <Row label="1.1 Employee Full Name">
              <Input value={form.employeeName} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.2 Date of Employment">
              <Input type="date" value={form.dateOfEmployment} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.3 Staff ID">
              <Input value={form.staffId} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.4 Department">
              <Input value={form.department} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
            <Row label="1.5 Position / Title">
              <Input value={form.position} className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" disabled />
            </Row>
          </Section>

          {/* 2. LEAVE DETAILS */}
          <Section title="2. LEAVE DETAILS">
            <Row label="2.1 Nature of Leave">
              <Input
                value={config.title || "Annual Leave"}
                className="w-[300px] h-8 border-blue-300 dark:border-[#3b6dae]/40 bg-gray-100 dark:bg-[#295482] text-black dark:text-slate-100 font-medium cursor-not-allowed"
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
                }}
              />
            </div>

            <Row label="2.3 Business Days Requested">
              <div className="flex items-center gap-2">
                <Input value={calculatedBusinessDays} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs w-24 bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium text-center" />
                <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Day(s)</span>
              </div>
            </Row>
            <Row label="2.4 Backup Person">
              <div className="space-y-2 py-1">
                {effectiveIsReadOnly ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">Name:</span>
                      <span className="text-xs font-medium">{form.backupPersonName || "Not selected"}</span>
                    </div>
                    {form.backupPersonPhone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-blue-600" />
                        <span className="text-xs font-medium">{form.backupPersonPhone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Select
                      value={form.backupPersonId}
                      onValueChange={(val) => {
                        const selectedStaff = staffForBackup.data?.find((s: any) => String(s.id) === val);
                        setForm({
                          ...form,
                          backupPersonId: val,
                          backupPersonName: selectedStaff?.name || "",
                          backupPersonPhone: selectedStaff?.phoneNumber || "",
                          contactDuringLeave: `Backup: ${selectedStaff?.name || ""}${selectedStaff?.phoneNumber ? " | Tel: " + selectedStaff.phoneNumber : ""}`,
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 border-blue-300 dark:border-[#3b6dae]/40 text-xs">
                        <SelectValue placeholder="Select a backup person..." />
                      </SelectTrigger>
                      <SelectContent>
                        {staffForBackup.data
                          ?.filter((s: any) => s.id !== user?.id)
                          .map((s: any) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              <div className="flex flex-col">
                                <span className="font-medium">{s.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {s.phoneNumber && <span>{s.phoneNumber} • </span>}
                                  {s.department?.name || s.department}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {form.backupPersonPhone && (
                      <div className="flex items-center gap-2 bg-blue-50 dark:bg-[#1a385c] rounded px-3 py-1.5 border border-blue-200 dark:border-[#3b6dae]/30">
                        <Phone size={14} className="text-blue-600 shrink-0" />
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{form.backupPersonPhone}</span>
                        {form.backupPersonName && (
                          <span className="text-xs text-gray-500 dark:text-slate-400 ml-1">— {form.backupPersonName}</span>
                        )}
                      </div>
                    )}
                    {form.backupPersonId && !form.backupPersonPhone && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 italic">No phone number on file for this staff member</p>
                    )}
                  </>
                )}
              </div>
            </Row>
            <Row label="2.5 Additional Contact Notes">
              <Textarea
                value={form.contactDuringLeave}
                onChange={(e) => setForm({ ...form, contactDuringLeave: e.target.value })}
                disabled={effectiveIsReadOnly}
                placeholder="Optional: additional contact info or notes during your leave..."
                className="min-h-12 border-blue-300 dark:border-[#3b6dae]/40 text-xs"
              />
            </Row>
            <Row label="2.6 Will you be outside the country?">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    checked={form.outsideCountry === "yes"}
                    onChange={() => setForm({ ...form, outsideCountry: "yes" })}
                    disabled={effectiveIsReadOnly}
                    className="w-3.5 h-3.5"
                  /> Yes
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    checked={form.outsideCountry === "no"}
                    onChange={() => setForm({ ...form, outsideCountry: "no" })}
                    disabled={effectiveIsReadOnly}
                    className="w-3.5 h-3.5"
                  /> No
                </label>
              </div>
            </Row>
          </Section>

          {/* 3. SIGNATURE & SUPPORTING DOCS */}
          <Section title="3. SIGNATURE & SUPPORTING DOCS">
            {config.requiresSupportingDoc && (
              <Row label="3.2 Supporting Document">
                <div className="space-y-2">
                  {!effectiveIsReadOnly && (
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setForm({ ...form, supportingDocument: e.target.files[0] });
                        }
                      }}
                      className="text-xs"
                    />
                  )}
                  {form.supportingDocument && <p className="text-xs text-green-600 font-semibold">✓ {form.supportingDocument.name}</p>}
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
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          checked={form.signatureMethod === "draw"}
                          onChange={() => setForm({ ...form, signatureMethod: "draw", employeeSignature: null })}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Draw Signature</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          checked={form.signatureMethod === "upload"}
                          onChange={() => setForm({ ...form, signatureMethod: "upload", employeeSignature: null })}
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
                            if (e.target.files?.[0]) {
                              const file = e.target.files[0];
                              setForm({ ...form, employeeSignature: file });
                              const reader = new FileReader();
                              reader.onload = (ev) => setForm((prev: any) => ({ ...prev, employeeSignatureUrl: ev.target?.result as string }));
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
                          setForm({ ...form, employeeSignature: file, employeeSignatureUrl: dataUrl });
                        }}
                        onClear={() => {
                          setForm({ ...form, employeeSignature: null, employeeSignatureUrl: "" });
                        }}
                      />
                    )}
                    
                    {form.employeeSignatureUrl && (
                       <div className="mt-2 animate-in zoom-in duration-300">
                          <img src={form.employeeSignatureUrl} alt="sig" className="h-16 object-contain border-2 border-blue-100 rounded-xl p-2 bg-white" />
                       </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-1">
                    {form.employeeSignatureUrl ? (
                      <img src={form.employeeSignatureUrl} alt="sig" className="h-16 object-contain" />
                    ) : (
                      <p className="text-xs italic text-gray-500">No signature</p>
                    )}
                  </div>
                )}
                <div className="mt-4 w-full md:w-[240px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-900 mb-1.5 opacity-60">Signature Date</p>
                  <Input
                    value={form.signatureDate || new Date().toISOString().split("T")[0]}
                    readOnly
                    className="h-9 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold cursor-not-allowed w-full border-blue-100 dark:border-blue-900/30 text-xs rounded-xl"
                  />
                </div>
              </div>
            </Row>
          </Section>

          {/* 4. APPROVAL WORKFLOW */}
          <Section title="4. APPROVAL WORKFLOW">
            {/* Always show 4.1 Line Manager/HOD section so the HOD signature is visible to everyone */}
            <Row label="4.1 Line Manager / HOD">
              <Input
                value={uniqueHeads.find((h: any) => h.id === parseInt(form.reportingManager))?.name || "Not assigned"}
                className="w-full h-8 border-blue-300 dark:border-[#3b6dae]/40 bg-gray-100 dark:bg-[#295482] text-black dark:text-slate-100 font-medium cursor-not-allowed mt-1 mb-1 max-w-[400px]"
                disabled
              />
              {form.managerSignatureUrl && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Approved by Manager:</p>
                  <img src={form.managerSignatureUrl} alt="Manager Signature" className="h-10 object-contain border border-blue-200 dark:border-[#3b6dae]/30 rounded p-1 bg-white dark:bg-[#1f426b]" />
                </div>
              )}
            </Row>



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
              <div className="p-4 border-b border-blue-400 dark:border-[#3b6dae]/50 bg-blue-50/30">
                <h3 className="text-sm font-bold text-blue-700 mb-3">Your Approval ({user?.role || "Approver"})</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Comments</label>
                    <Textarea value={approvalComments} onChange={(e) => setApprovalComments(e.target.value)} disabled={isReadOnly} placeholder="Add comments..." className="text-xs border-blue-300 dark:border-[#3b6dae]/40" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Signature</label>
                    {!isReadOnly ? (
                      <div className="space-y-3">
                        <div className="flex gap-4 mb-4">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              checked={approverSignatureMethod === "draw"}
                              onChange={() => {
                                setApproverSignatureMethod("draw");
                                setApproverSignature(null);
                                setApproverSignatureUrl("");
                              }}
                              className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Draw</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              checked={approverSignatureMethod === "upload"}
                              onChange={() => {
                                setApproverSignatureMethod("upload");
                                setApproverSignature(null);
                                setApproverSignatureUrl("");
                              }}
                              className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Upload</span>
                          </label>
                        </div>

                        {approverSignatureMethod === "upload" ? (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setApproverSignature(file);
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setApproverSignatureUrl(ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="block w-full text-xs text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:font-semibold file:bg-[#3b6dae]/10 file:text-[#3b6dae] hover:file:bg-[#3b6dae]/20 border border-[#3b6dae]/30 rounded-lg p-1 transition-colors hover:border-[#3b6dae]/60 cursor-pointer"
                            />
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

                        {approverSignatureUrl && (
                          <div className="mt-2 animate-in zoom-in duration-300">
                            <img
                              src={approverSignatureUrl}
                              alt="Signature Preview"
                              className="h-10 object-contain border border-blue-300 dark:border-[#3b6dae]/40 p-1 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs italic text-gray-500">Signature on file</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* ACTIONS & FOOTER */}
        <div className="no-print flex justify-between items-center px-6 py-4 border-t border-blue-400 dark:border-[#3b6dae]/50 bg-gray-50 dark:bg-[#1a385c] gap-4 mt-4">
          {requestData?.status === "approved" && (
            <div className="flex gap-2">
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
            <div className="flex gap-2 w-full">
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
                  <Button variant="outline" disabled={isSubmitting} onClick={handleSaveAsDraft} className="border-blue-400 dark:border-[#3b6dae]/50">Save Draft</Button>
                  <Button disabled={isSubmitting} onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
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
                  placeholder="Provide a clear and professional reason for rejection (minimum 10 characters)..." 
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
                disabled={rejectReason.trim().length < 10 || isLoading}
                onClick={() => {
                  if (rejectReason.trim().length >= 10) {
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
    <div className="border-t border-[#3b6dae]">
      <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] border-b border-[#3b6dae] gap-0">
      <div className="px-2 md:px-3 py-1.5 md:py-2 font-medium md:border-r border-[#3b6dae] bg-blue-100 text-[#3b6dae] text-[10px] md:text-xs md:whitespace-nowrap">{label}</div>
      <div className="px-2 md:px-3 py-1 md:py-1 text-xs md:text-sm">{children}</div>
    </div>
  );
}
