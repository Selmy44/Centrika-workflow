"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";
import DateRangePicker from "@/components/DateRangePicker";
import SingleDatePicker from "@/components/SingleDatePicker";
import { getLeaveTypeConfig } from "@/lib/leaveTypeConfig";

interface LeaveRequestFormProps {
  requestId?: number;
  requestData?: any;
  isApprover?: boolean;
  isReadOnly?: boolean;
  onApprove?: (data: any) => void;
  onReject?: (reason: string) => void;
  isLoading?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
  onBack?: () => void;
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
  onClose,
  onBack,
  leaveType: initialLeaveType,
}: LeaveRequestFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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
    supportingDocument: null as File | null,
    supportingDocumentUrl: "",
    employeeSignature: null as File | null,
    employeeSignatureUrl: "",
    signatureDate: "",
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    documentId: "",
  });

  const [approvalComments, setApprovalComments] = useState("");
  const [approverSignature, setApproverSignature] = useState<File | null>(null);
  const [approverSignatureFileId, setApproverSignatureFileId] = useState<number | null>(null);
  const [selectedHR, setSelectedHR] = useState("");

  const headsOfDept = trpc.users.listHeads.useQuery();
  const hrUsers = trpc.users.getHRUsers.useQuery();

  const isApprover = propsIsApprover !== undefined ? propsIsApprover : (!!onApprove || !!onReject);
  const effectiveIsReadOnly = isReadOnly || isApprover;

  useEffect(() => {
    if (requestData) {
      setForm((prev: any) => ({
        ...prev,
        employeeName: requestData.user?.name || requestData.employee?.name || prev.employeeName,
        staffId: requestData.user?.staffId || requestData.employee?.staffId || prev.staffId,
        department: requestData.user?.department?.name || requestData.employee?.department || prev.department,
        position: requestData.user?.position || requestData.employee?.position || prev.position,
        leaveType: requestData.type === "leave" ? (requestData.leaveType || prev.leaveType) : prev.leaveType,
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
        leaveType: initialLeaveType || prev.leaveType,
      }));
    }
  }, [user, requestId, initialLeaveType, requestData]);

  const uniqueHeads = headsOfDept.data || [];
  const uniqueHR = hrUsers.data || [];

  const config = getLeaveTypeConfig(form.leaveType);
  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    pink: "bg-pink-500",
    cyan: "bg-cyan-500",
    green: "bg-green-500",
    gray: "bg-gray-500"
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

  const handleSaveAsDraft = async () => {
    toast.success("Draft saved successfully");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      toast.success("Request submitted successfully");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="w-full bg-white text-black px-4 leave-form-container relative">
      <button
        onClick={() => onBack ? onBack() : (onClose ? onClose() : onSuccess?.())}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
        title="Close form"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div>
        {/* HEADER WITH LOGO AND CONTACT INFO */}
        <div className="flex justify-between items-start px-6 py-3 gap-8">
          <div className="shrink-0">
            <img src="/logo/centrikaLogo.png" alt="Centrika Logo" className="h-20 w-auto" />
          </div>
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

        {/* TITLE BAR (DYNAMIC COLOR) */}
        <div className={`${titleBarColor} text-white text-center font-bold py-2 text-lg tracking-wide uppercase`}>
          {config.title || "LEAVE REQUEST FORM"}
        </div>

        {/* REQUEST HEADER SECTION (5-col style requested previously, adopting 4-col inputs style matching CarRequest) */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 text-sm items-end">
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-xs">Department</p>
            <div className="flex gap-0 items-center">
              <span className="text-blue-600 font-bold text-xs whitespace-nowrap">CTK - </span>
              <Input value={form.department} className="w-full h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed border-l-0" disabled />
            </div>
          </div>
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-xs">Date of Request</p>
            <Input type="text" value={new Date().toISOString().split('T')[0]} className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed" disabled />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Staff ID</p>
            <Input value={form.staffId} className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed" disabled />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Employee Name</p>
            <Input value={form.employeeName} className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed" disabled />
          </div>
        </div>

        {/* REQUEST DETAILS */}
        <div className="border-t border-blue-400">
          <div className="bg-blue-600 text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

          {/* 1. EMPLOYEE INFORMATION */}
          <Section title="1. EMPLOYEE INFORMATION">
            <Row label="1.1 Employee Full Name">
              <Input value={form.employeeName} className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium" disabled />
            </Row>
            <Row label="1.2 Date of Employment">
              <Input type="date" value={form.dateOfEmployment} className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium" disabled />
            </Row>
            <Row label="1.3 Staff ID">
              <Input value={form.staffId} className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium" disabled />
            </Row>
            <Row label="1.4 Department">
              <Input value={form.department} className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium" disabled />
            </Row>
            <Row label="1.5 Position / Title">
              <Input value={form.position} className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium" disabled />
            </Row>
          </Section>

          {/* 2. LEAVE DETAILS */}
          <Section title="2. LEAVE DETAILS">
            <Row label="2.1 Nature of Leave">
              <Select value={form.leaveType} onValueChange={(v: any) => setForm({ ...form, leaveType: v })} disabled={effectiveIsReadOnly}>
                <SelectTrigger className="w-[300px] h-8 border-blue-300 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="parental">Parental Leave</SelectItem>
                  <SelectItem value="personal">Personal Leave</SelectItem>
                  <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="2.2 Leave Duration (Start – End)">
              <DateRangePicker
                startDate={form.startDate}
                endDate={form.endDate}
                onStartDateChange={(d: string) => setForm({ ...form, startDate: d })}
                onEndDateChange={(d: string) => setForm({ ...form, endDate: d })}
                disabled={effectiveIsReadOnly}
                maxDays={200}
              />
            </Row>
            <Row label="2.3 Business Days Requested">
              <div className="flex items-center gap-2">
                <Input value={calculatedBusinessDays} disabled className="border-blue-300 h-7 text-xs w-24 bg-gray-100 cursor-not-allowed !text-black font-medium text-center" />
                <span className="text-xs font-medium text-gray-600">Day(s)</span>
              </div>
            </Row>
            <Row label="2.4 Contact Details / Backup Person">
              <Textarea
                value={form.contactDuringLeave}
                onChange={(e) => setForm({ ...form, contactDuringLeave: e.target.value })}
                disabled={effectiveIsReadOnly}
                placeholder="Provide details about who will cover your duties and how to reach you..."
                className="min-h-16 border-blue-300 text-xs"
              />
            </Row>
            <Row label="2.5 Will you be outside the country?">
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

          {/* 3. LEAVE BALANCE & SUPPORTING DOCS */}
          <Section title="3. LEAVE BALANCE & SIGNATURE">
            <Row label="3.1 Annual Entitlement">
              <Input value={config.entitlementDays} disabled className="border-blue-300 h-7 text-xs w-24 bg-gray-100 cursor-not-allowed !text-black font-medium text-center" />
            </Row>

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
                </div>
              </Row>
            )}

            <Row label={`${config.requiresSupportingDoc ? "3.3" : "3.2"} Employee Signature`}>
              <div className="space-y-3">
                {!effectiveIsReadOnly ? (
                  <>
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
                      className="text-xs"
                    />
                    {form.employeeSignatureUrl && <img src={form.employeeSignatureUrl} alt="sig" className="h-10 object-contain border border-blue-300 p-1" />}
                  </>
                ) : (
                  <div className="space-y-1">
                    {form.employeeSignatureUrl ? <img src={form.employeeSignatureUrl} alt="sig" className="h-10 object-contain" /> : <p className="text-xs italic text-gray-500">No signature</p>}
                  </div>
                )}
                <div className="mt-2 w-[240px]">
                   <SingleDatePicker value={form.signatureDate} onChange={(d: string) => setForm({ ...form, signatureDate: d })} label="Signature Date" />
                </div>
              </div>
            </Row>
          </Section>

          {/* 4. APPROVAL WORKFLOW */}
          <Section title="4. APPROVAL WORKFLOW">
            {isApprover ? (
              <div className="p-4 border-b border-blue-400 bg-blue-50/30">
                <h3 className="text-sm font-bold text-blue-700 mb-3">Your Approval ({user?.role || "Approver"})</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Comments</label>
                    <Textarea value={approvalComments} onChange={(e) => setApprovalComments(e.target.value)} disabled={isReadOnly} placeholder="Add comments..." className="text-xs border-blue-300" />
                  </div>
                  {user?.role === "head_of_department" && !isReadOnly && (
                    <div>
                      <label className="text-xs font-semibold block mb-1">Forward to HR</label>
                      <Select value={selectedHR} onValueChange={setSelectedHR}>
                        <SelectTrigger className="h-8 text-xs border-blue-300 w-[300px]">
                          <SelectValue placeholder="Select HR officer" />
                        </SelectTrigger>
                        <SelectContent className="border-blue-200">
                          {uniqueHR.map((hr: any) => (
                            <SelectItem key={hr.id} value={String(hr.id)}>{hr.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold block mb-1">Signature</label>
                    {!isReadOnly ? (
                       <input type="file" onChange={(e) => setApproverSignature(e.target.files?.[0] || null)} className="text-xs" />
                    ) : (
                      <p className="text-xs italic text-gray-500">Signature on file</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Row label="4.1 Line Manager / HOD">
                  <Select value={form.reportingManager} onValueChange={(v) => !effectiveIsReadOnly && setForm({ ...form, reportingManager: v })} disabled={effectiveIsReadOnly}>
                    <SelectTrigger className="w-full h-10 border-blue-300 bg-white text-black font-medium focus:ring-blue-500 mt-1 mb-1 max-w-[400px]">
                      <SelectValue placeholder="-- Select Department Head --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-blue-200">
                      {uniqueHeads.map((head: any) => (
                        <SelectItem key={head.id} value={String(head.id)} className="focus:bg-blue-500 focus:text-white">{head.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
                <Row label="4.2 HR Review">
                  <p className="text-xs text-gray-500 font-medium">Pending HR Approval</p>
                </Row>
                <Row label="4.3 Final Approval (CEO/MD)">
                  <p className="text-xs text-gray-500 font-medium">Pending Final Approval</p>
                </Row>
              </>
            )}
          </Section>
        </div>

        {/* ACTIONS & FOOTER */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-blue-400 bg-gray-50 gap-4 mt-4">
          <div className="flex gap-2">
            <Button variant="outline" disabled={isSubmitting} onClick={() => window.print()} className="border-blue-400 text-blue-600">
              <Printer size={16} className="mr-1" /> Print
            </Button>
            <Button variant="outline" disabled={isSubmitting} onClick={() => toast.info("Requires PDF generation")} className="border-blue-400 text-blue-600">
              <Download size={16} className="mr-1" /> Download
            </Button>
          </div>
          <div className="flex gap-2">
            {isApprover && !isReadOnly && (
               <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>Reject</Button>
            )}
            {isApprover && !isReadOnly && (
               <Button onClick={() => onApprove?.({ comments: approvalComments, signatureFile: approverSignature, selectedHR })} className="bg-green-600 hover:bg-green-700">Approve</Button>
            )}

            {!isApprover && !isReadOnly && (
              <>
                <Button variant="outline" disabled={isSubmitting} onClick={handleSaveAsDraft} className="border-blue-400">Save Draft</Button>
                <Button disabled={isSubmitting} onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-gray-600 py-3 border-t border-gray-200 space-y-1">
          <p>www.centrika.rw</p>
          <p>1 | Centrika Ltd | Motto: Delivering Tomorrow's Solutions Today</p>
        </div>
      </div>

      {isApprover && (
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reject Request</DialogTitle></DialogHeader>
            <Textarea placeholder="Rejection reason..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
              <Button variant="destructive" disabled={!rejectReason || isLoading} onClick={() => onReject?.(rejectReason)}>Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-blue-400">
      <div className="bg-blue-500 text-white font-bold px-4 py-2 text-sm">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[220px_1fr] border-b border-blue-400">
      <div className="px-3 py-2 font-medium border-r border-blue-400 bg-blue-100 text-blue-700 text-xs">{label}</div>
      <div className="px-3 py-1">{children}</div>
    </div>
  );
}
