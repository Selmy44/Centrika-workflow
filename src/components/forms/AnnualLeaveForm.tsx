"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin } from "lucide-react";
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

interface Props {
  requestData?: any;
  isReadOnly?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
  onBack?: () => void;
}

/**
 * Annual Leave Form - Professional document-style design
 * Matches CarRequestForm / ExpenditureRequestForm / AssetRequestForm layout
 */
export default function AnnualLeaveForm({ requestData, isReadOnly = false, onSuccess, onClose, onBack }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [takenLeaveDates, setTakenLeaveDates] = useState<string[]>([]);

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
        ...d,
        employeeSignature: null, // Don't restore file objects
      }));
    }
  }, [savedFormData.data]);

  // Merge requestData fields directly to handle cases where form submission is missing or for additional robustness
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
      }));
    }
  }, [requestData]);

  useEffect(() => {
    if (user && autoFillData && !isReadOnly) {
      const sequence = String(Math.floor(Math.random() * 10000)).padStart(5, "0");
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
      const docId = `AL-${new Date().getFullYear()}-${currentMonth}-${sequence}`;

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
  }, [user, autoFillData, isReadOnly]);

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

        {/* ===== REQUEST HEADER SECTION ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 lg:gap-3 px-3 lg:px-6 py-2 lg:py-3 text-xs lg:text-sm items-end">
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-xs uppercase tracking-tighter">CTK</p>
            <div className="flex gap-0 items-center">
              <Input
                value={form.department}
                className="w-full h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
                disabled
              />
            </div>
          </div>
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-xs">Nature of Leave</p>
            <Input
              value="Annual Leave"
              className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Year</p>
            <Input
              value={form.year}
              className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Month</p>
            <Input
              value={form.month}
              className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Document ID</p>
            <Input
              value={form.documentId}
              className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
        </div>

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
            <Row label="1.3 Date of Employment">
              <Input
                type="date"
                value={form.dateOfEmployment}
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
            <Row label="1.5 Department">
              <Input
                value={form.department}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.6 Position / Title">
              <Input
                value={form.position}
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
                disabled={isReadOnly}
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
                }}
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
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    value="yes"
                    checked={form.outsideCountry === "yes"}
                    onChange={(e) => !isReadOnly && setForm({ ...form, outsideCountry: e.target.value })}
                    disabled={isReadOnly}
                    className="w-4 h-4"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    value="no"
                    checked={form.outsideCountry === "no"}
                    onChange={(e) => !isReadOnly && setForm({ ...form, outsideCountry: e.target.value })}
                    disabled={isReadOnly}
                    className="w-4 h-4"
                  />
                  No
                </label>
              </div>
            </Row>
            <Row label="2.4 Contact During Leave">
              <Textarea
                value={form.contactDuringLeave}
                onChange={(e) => setForm({ ...form, contactDuringLeave: e.target.value })}
                placeholder="Provide contact details or person covering for you..."
                className={`min-h-20 border-blue-300 dark:border-[#3b6dae]/40 text-xs ${isReadOnly ? 'bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100' : ''}`}
                disabled={isReadOnly}
              />
            </Row>
          </Section>

          {/* 3. EMPLOYEE SIGNATURE */}
          <Section title="3. EMPLOYEE SIGNATURE">
            <Row label="4.1 Your Signature">
              <div className="space-y-3 py-1 w-full">
                {isReadOnly ? (
                  <div className="space-y-1">
                    {form.employeeSignatureUrl ? (
                      <img src={form.employeeSignatureUrl} alt="Employee Signature" className="h-14 object-contain" />
                    ) : (
                      <p className="text-xs italic text-gray-500">No signature provided</p>
                    )}
                  </div>
                ) : (
                  <>
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

                    {form.employeeSignatureUrl && (
                      <div className="mt-2 animate-in zoom-in duration-300">
                        <img src={form.employeeSignatureUrl} alt="signature" className="h-16 object-contain" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </Row>
            <Row label="3.2 Signature Date">
              <Input
                value={form.signatureDate || new Date().toISOString().split("T")[0]}
                readOnly
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium w-40"
              />
            </Row>
          </Section>

          {/* 4. INITIAL APPROVAL */}
          <Section title="4. INITIAL APPROVAL">
            <Row label="4.1 Reporting Manager / HOD">
              <div className="flex flex-col gap-1 w-full">
                <Input
                  value={uniqueHeads.find((h: any) => h.id === parseInt(form.reportingManager))?.name || "Not assigned"}
                  className="w-full h-8 border-blue-300 dark:border-[#3b6dae]/40 bg-gray-100 dark:bg-[#295482] text-black dark:text-slate-100 font-medium cursor-not-allowed mt-1 mb-1 max-w-[400px]"
                  disabled
                />
                {isReadOnly && form.managerSignatureUrl && (
                  <div className="mt-1">
                    <p className="text-[10px] text-green-600 font-semibold mb-0.5">✓ Approved by HOD</p>
                    <img src={form.managerSignatureUrl} alt="HOD Signature" className="h-10 object-contain" />
                  </div>
                )}
              </div>
            </Row>
          </Section>
        </div>

        {/* ===== ACTIONS ===== */}
        {!isReadOnly && (
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center px-3 lg:px-6 py-3 lg:py-4 bg-gray-50 dark:bg-[#1a385c] gap-2 lg:gap-4">
            <div className="flex gap-2">
              {/* Print/Download options are only available for approved requests */}
            </div>
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
                Submit Request
              </Button>
            </div>
          </div>
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
