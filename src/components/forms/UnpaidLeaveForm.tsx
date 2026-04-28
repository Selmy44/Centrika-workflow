"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DateRangePicker from "@/components/DateRangePicker";
import SingleDatePicker from "@/components/SingleDatePicker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { LeaveBalanceCalculator } from "./shared/LeaveBalanceCalculator";
import { SignaturePad } from "@/components/SignaturePad";
import { base64ToFile, fileToBase64 } from "@/lib/fileUtils";

interface Props {
  requestData?: any;
  isReadOnly?: boolean;
  onSuccess?: () => void;
}

/**
 * Unpaid Leave Form - Professional document-style design
 * Matches CarRequestForm / ExpenditureRequestForm / AssetRequestForm layout
 */
export default function UnpaidLeaveForm({ requestData, isReadOnly = false, onSuccess }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acknowledgeUnpaid, setAcknowledgeUnpaid] = useState(false);

  const [form, setForm] = useState({
    documentId: "",
    requestNumber: "",
    departmentHeader: "COMP",
    leaveType: "unpaid",
    year: new Date().getFullYear().toString(),
    month: String(new Date().getMonth() + 1).padStart(2, "0"),
    employeeName: "",
    dateOfEmployment: "",
    staffId: "",
    department: "",
    position: "",
    startDate: "",
    endDate: "",
    leaveDaysRequested: "",
    outsideCountry: "no",
    reportingManager: "",
    // Unpaid Leave Specific
    reasonForUnpaid: "",
    contactDuringLeave: "",
    leaveDaysEntitled: "",
    leaveDaysTaken: "",
    leaveDaysRemaining: "",
    employeeSignature: null as File | null,
    employeeSignatureUrl: "" as string,
    signatureDate: new Date().toISOString().split("T")[0],
    signatureMethod: "draw" as "upload" | "draw",
    supportingDocument: null as File | null,
    supportingDocumentUrl: "",
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
  const uploadAttachment = (trpc as any).requests.uploadAttachment.useMutation();

  // Fetch saved form data for draft/read-only views
  const savedFormData = (trpc as any).requests.getLeaveFormData.useQuery(
    { requestId: requestData?.id || 0 },
    { enabled: !!requestData?.id && (isReadOnly || requestData?.status === "draft") }
  );

  // Merge saved form data when available
  useEffect(() => {
    if (savedFormData.data) {
      const d = savedFormData.data;
      setForm((prev: any) => ({
        ...prev,
        ...d, // Spread all saved data first
        // Then explicitly set file/signature fields that can't be serialized
        employeeSignature: null, // Don't restore file objects
      }));
    }
  }, [savedFormData.data]);

  useEffect(() => {
    if (user && autoFillData) {
      const sequence = String(Math.floor(Math.random() * 10000)).padStart(5, "0");
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
      const docId = `UL-${new Date().getFullYear()}-${currentMonth}-${sequence}`;

      setForm((prev) => ({
        ...prev,
        documentId: docId,
        employeeName: user.name || "",
        staffId: user.staffId || "",
        department: user.department?.name || "",
        position: user.position || "",
        dateOfEmployment: autoFillData.dateOfEmployment || "",
        reportingManager: autoFillData.managerId ? String(autoFillData.managerId) : "",
      }));
    }
  }, [user, autoFillData]);

  // Leave balance calculated by LeaveBalanceCalculator component

  const validate = () => {
    if (!form.reportingManager) {
      toast.error("Please select a reporting manager");
      return false;
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Start and end dates are required");
      return false;
    }
    if (form.endDate < form.startDate) {
      toast.error("End date must be after start date");
      return false;
    }
    if (!form.leaveDaysRequested || parseInt(form.leaveDaysRequested) <= 0) {
      toast.error("Requested days must be greater than 0. Please check your dates.");
      return false;
    }
    if (!form.reasonForUnpaid.trim()) {
      toast.error("Please provide reason for unpaid leave");
      return false;
    }
    if (!form.contactDuringLeave.trim()) {
      toast.error("Contact details during leave are required");
      return false;
    }
    if (!acknowledgeUnpaid) {
      toast.error("You must acknowledge that this is unpaid leave");
      return false;
    }
    return true;
  };

  const handleSubmit = async (submit: boolean) => {
    if (submit && !validate()) return;

    setIsSubmitting(true);
    try {
      const created = await createLeave.mutateAsync({
        title: `Unpaid Leave Request - ${form.documentId}`,
        leaveType: "unpaid" as any,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reasonForUnpaid,
        leaveDaysEntitled: parseInt(form.leaveDaysEntitled) || 0,
        leaveDaysTaken: parseInt(form.leaveDaysTaken) || 0,
        leaveDaysRequested: parseInt(form.leaveDaysRequested) || 0,
      });

      const requestId = (created as any)?.id as number;
      
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

        try {
          // Store form data for both draft and submitted forms
          await storeFormData.mutateAsync({
            requestId: requestId,
            formData: { ...form, employeeSignature: undefined, supportingDocument: undefined, supportingDocumentUrl: finalSupportingDocUrl, leaveType: "unpaid" },
          });
        } catch (e) { console.error("Failed to store form data", e); }

        if (submit) {
          await submitRequest.mutateAsync({
            id: requestId,
            initialApproverId: parseInt(form.reportingManager),
          });
        }
      }

      toast.success(submit ? "🎉 Unpaid leave request successfully submitted!" : "Draft saved");
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
        <div className="flex flex-col md:flex-row md:justify-between md:items-start px-3 md:px-6 py-3 gap-4 md:gap-8">
          <div className="shrink-0">
            <img
              src="/logo/centrikaLogo.png"
              alt="Centrika Logo"
              className="h-14 md:h-20 w-auto"
            />
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
        </div>

        {/* ===== TITLE BAR (GOLDEN/YELLOW) ===== */}
        <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide uppercase">
          Unpaid Leave Request Form
        </div>

        {/* ===== IMPORTANT NOTICE ===== */}
        <div className="mx-3 md:mx-6 mt-3 p-3 bg-amber-50 border border-amber-300 rounded flex gap-2">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-amber-900 mb-1">Important Notice — Unpaid Leave</p>
            <ul className="text-[10px] text-amber-800 space-y-0.5 list-disc list-inside">
              <li>During unpaid leave, you will not receive salary or benefits</li>
              <li>Unpaid leave may affect your annual leave entitlements</li>
              <li>This request requires approval from multiple levels of management</li>
              <li>The organization reserves the right to approve or deny unpaid leave requests</li>
              <li>Extended unpaid leave may have implications on employment</li>
            </ul>
          </div>
        </div>

        {/* ===== REQUEST HEADER SECTION - Responsive Grid ===== */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm items-end">
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-[10px] md:text-xs">Name of Department</p>
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
            <p className="font-semibold text-blue-600 mb-1 text-[10px] md:text-xs">Nature of Leave</p>
            <Input
              value="Unpaid Leave"
              className="h-6 md:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] md:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-[10px] md:text-xs mb-1">Year</p>
            <Input
              value={form.year}
              className="h-6 md:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] md:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-[10px] md:text-xs mb-1">Month</p>
            <Input
              value={form.month}
              className="h-6 md:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] md:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-[10px] md:text-xs mb-1">Document ID</p>
            <Input
              value={form.documentId}
              className="h-6 md:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] md:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        {/* ===== REQUEST DETAILS ===== */}
        <div className="border-t border-blue-400 dark:border-[#3b6dae]/50">
          <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

          {/* 1. EMPLOYEE INFORMATION */}
          <Section title="1. EMPLOYEE INFORMATION">
            <Row label="1.1 Request Number">
              <Input
                value={form.documentId}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.2 Employee Full Name">
              <Input
                value={form.employeeName}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.3 Date of Employment">
              <Input
                type="date"
                value={form.dateOfEmployment}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.4 Employee / Staff ID">
              <Input
                value={form.staffId}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.5 Department">
              <Input
                value={form.department}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.6 Position / Title">
              <Input
                value={form.position}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
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
                maxDays={365}
              />
            </Row>

            <div className="px-4 pb-4">
              <LeaveBalanceCalculator 
                leaveType="unpaid"
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
                }}
              />
            </div>

            <Row label="2.2 Number of Leave Days Requested">
              <Input
                value={form.leaveDaysRequested}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium w-24"
                disabled
              />
            </Row>
            <Row label="2.3 Will You Be Outside the Country?">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    value="yes"
                    checked={form.outsideCountry === "yes"}
                    onChange={(e) => setForm({ ...form, outsideCountry: e.target.value })}
                    className="w-4 h-4"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    value="no"
                    checked={form.outsideCountry === "no"}
                    onChange={(e) => setForm({ ...form, outsideCountry: e.target.value })}
                    className="w-4 h-4"
                  />
                  No
                </label>
              </div>
            </Row>
          </Section>

          {/* 3. REASON FOR UNPAID LEAVE */}
          <Section title="3. REASON FOR UNPAID LEAVE">
            <Row label="3.1 Please Explain Your Reason *">
              <div className="space-y-1 w-full">
                <Textarea
                  value={form.reasonForUnpaid}
                  onChange={(e) => setForm({ ...form, reasonForUnpaid: e.target.value })}
                  placeholder="Please provide a detailed explanation for requesting unpaid leave..."
                  className="min-h-24 border-blue-300 dark:border-[#3b6dae]/40 text-xs"
                  required
                />
                <p className="text-[10px] text-gray-500">This information will be reviewed by your department head, HR, and management.</p>
              </div>
            </Row>
          </Section>

          {/* 4. CONTACT DURING LEAVE */}
          <Section title="4. CONTACT DURING LEAVE">
            <Row label="4.1 Contact Information">
              <Textarea
                value={form.contactDuringLeave}
                onChange={(e) => setForm({ ...form, contactDuringLeave: e.target.value })}
                placeholder="Provide contact details or person covering for you during this period..."
                className="min-h-20 border-blue-300 dark:border-[#3b6dae]/40 text-xs"
              />
            </Row>
            <Row label="3.3 Supporting Document">
              <div className="space-y-2">
                {!isReadOnly && (
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
          </Section>

          {/* 5. EMPLOYEE ACKNOWLEDGMENT */}
          <Section title="5. EMPLOYEE ACKNOWLEDGMENT">
            <div className="px-4 py-3 border-b border-blue-400 dark:border-[#3b6dae]/50">
              <label className="flex items-start gap-3 p-3 bg-amber-50 rounded border border-amber-200">
                <input
                  type="checkbox"
                  checked={acknowledgeUnpaid}
                  onChange={(e) => setAcknowledgeUnpaid(e.target.checked)}
                  className="w-5 h-5 mt-0.5 border-amber-300 rounded shrink-0"
                  required
                />
                <div>
                  <p className="font-semibold text-amber-900 text-xs">I acknowledge and understand that:</p>
                  <ul className="text-[10px] text-amber-800 space-y-0.5 mt-1 list-disc list-inside">
                    <li>This leave will be unpaid and I will not receive salary during this period</li>
                    <li>I understand the implications of unpaid leave on my benefits and service record</li>
                    <li>I will resume normal duties on the scheduled return date</li>
                    <li>This request is subject to management approval</li>
                  </ul>
                </div>
              </label>
            </div>
          </Section>

          {/* 6. INITIAL APPROVAL */}
          <Section title="6. INITIAL APPROVAL">
            <Row label="6.1 Reporting Manager / HOD">
              <Input
                value={uniqueHeads.find((h: any) => h.id === parseInt(form.reportingManager))?.name || "Not assigned"}
                className="w-full h-8 border-blue-300 dark:border-[#3b6dae]/40 bg-gray-100 dark:bg-[#295482] text-black dark:text-slate-100 font-medium cursor-not-allowed mt-1 mb-1 max-w-[400px]"
                disabled
              />
            </Row>
            <div className="bg-blue-50 p-3 text-[10px] text-blue-600 border-b border-blue-400 dark:border-[#3b6dae]/50">
              * Note: Unpaid leave requests require approval from HOD, HR, and CEO/MD.
            </div>
          </Section>

          {/* 7. EMPLOYEE SIGNATURE */}
          <Section title="7. EMPLOYEE SIGNATURE">
            <Row label="7.1 Your Signature">
              <div className="space-y-3 py-1">
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      checked={form.signatureMethod === "draw"}
                      onChange={() => {
                        setForm({ ...form, signatureMethod: "draw", employeeSignature: null, employeeSignatureUrl: "" });
                      }}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-[#3b6dae] group-hover:text-blue-800">Draw Signature</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      checked={form.signatureMethod === "upload"}
                      onChange={() => {
                        setForm({ ...form, signatureMethod: "upload", employeeSignature: null, employeeSignatureUrl: "" });
                      }}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-[#3b6dae] group-hover:text-blue-800">Upload Image</span>
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
                          reader.onload = (ev) => {
                            setForm((prev) => ({
                              ...prev,
                              employeeSignatureUrl: ev.target?.result as string,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs block w-full text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                
                {form.employeeSignatureUrl && form.signatureMethod === "upload" && (
                  <div className="p-2 border border-dashed border-blue-300 dark:border-[#3b6dae]/40 rounded bg-blue-50 inline-block animate-in zoom-in duration-300">
                    <img src={form.employeeSignatureUrl} alt="signature" className="h-16 object-contain" />
                  </div>
                )}
              </div>
            </Row>
            <Row label="8.2 Signature Date">
              <Input
                value={form.signatureDate || new Date().toISOString().split("T")[0]}
                readOnly
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium w-40"
              />
            </Row>
          </Section>
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center px-3 md:px-6 py-3 md:py-4 border-t border-blue-400 dark:border-[#3b6dae]/50 bg-gray-50 dark:bg-[#1a385c] gap-2 md:gap-4">
          <div className="flex gap-2">
            {/* Buttons hidden until approved */}
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
    <div className="border-t border-blue-400 dark:border-[#3b6dae]/50">
      <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] border-b border-blue-400 dark:border-[#3b6dae]/50 gap-0">
      <div className="px-2 md:px-3 py-1.5 md:py-2 font-medium md:border-r border-blue-400 dark:border-[#3b6dae]/50 bg-blue-100 text-blue-700 text-[10px] md:text-xs md:whitespace-nowrap">
        {label}
      </div>
      <div className="px-2 md:px-3 py-1 text-xs md:text-sm">{children}</div>
    </div>
  );
}
