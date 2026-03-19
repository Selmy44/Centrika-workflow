import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";
import DateRangePicker from "@/components/DateRangePicker";
import SingleDatePicker from "@/components/SingleDatePicker";
import { FormContainer, FormHeader, FormSection, FormRow, EmployeeInfoSection, FormFooter, FormActions } from "./shared";

interface LeaveRequestFormProps {
  requestId?: number;
  requestData?: any; // Added to support passing existing request data
  isApprover?: boolean; // Explicitly control if the view is for an approver
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
  const { user } = useAuth();
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

  const userRequests = trpc.requests.listUserRequests.useQuery();
  const headsOfDept = trpc.users.listHeads.useQuery();
  const hrUsers = trpc.users.getHRUsers.useQuery();

  const isApprover = propsIsApprover !== undefined ? propsIsApprover : (!!onApprove || !!onReject);
  const effectiveIsReadOnly = isReadOnly || isApprover;

  // Auto-fill employee info or use requestData
  useEffect(() => {
    if (requestData) {
      // If we have requestData, populate what we can
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
      setForm((prev: any) => ({
        ...prev,
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
    // Logic for saving as draft
    toast.success("Draft saved successfully");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Logic for submission
      toast.success("Request submitted successfully");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRequestApproved = false; // Replace with actual status
  const isRequestRejected = false; // Replace with actual status
  const approvalSectionIsReadOnly = isReadOnly; // Replace with actual logic

  const localLeaveBalance = {
    totalAnnualLeave: 18,
    isEligible: true,
  };

  const leaveBalance = {
    annualLeaveTaken: 0,
  };

  return (
    <FormContainer onBack={onBack} onClose={onClose || onSuccess}>
      <FormHeader
        title="LEAVE REQUEST FORM"
        documentId={form.documentId}
        status={requestId ? "submitted" : "draft"}
        date={new Date().toLocaleDateString()}
      />

      <div className="space-y-6">
        {/* REQUEST HEADER SECTION */}
        <div className="grid grid-cols-5 gap-4 px-8 py-4 text-[10px] items-end no-print bg-[#c79d2d]/5 border-b border-[#3b6dae]/10">
          <div className="col-span-1">
            <p className="font-black text-[#3b6dae] mb-1.5 uppercase tracking-tighter text-[10px]">Department</p>
            <Input value={form.department} disabled className="h-8 text-[11px] bg-white border-[#3b6dae]/20 font-black text-[#3b6dae]" />
          </div>
          <div>
            <p className="font-black text-[#3b6dae] mb-1.5 uppercase tracking-tighter text-[10px]">Nature of Leave</p>
            <Input value={form.leaveType.charAt(0).toUpperCase() + form.leaveType.slice(1)} disabled className="h-8 text-[11px] bg-white border-[#3b6dae]/20 font-black text-[#3b6dae]" />
          </div>
          <div>
            <p className="font-black text-[#3b6dae] mb-1.5 uppercase tracking-tighter text-[10px]">Year</p>
            <Input value={form.year} disabled className="h-8 text-[11px] bg-white border-[#3b6dae]/20 font-black text-[#3b6dae]" />
          </div>
          <div>
            <p className="font-black text-[#3b6dae] mb-1.5 uppercase tracking-tighter text-[10px]">Month</p>
            <Input value={form.month} disabled className="h-8 text-[11px] bg-white border-[#3b6dae]/20 font-black text-[#3b6dae]" />
          </div>
          <div>
            <p className="font-black text-[#3b6dae] mb-1.5 uppercase tracking-tighter text-[10px]">Document ID</p>
            <Input value={form.documentId} placeholder="Auto-generated" disabled className="h-8 text-[11px] bg-white border-[#3b6dae]/20 font-black text-[#3b6dae]" />
          </div>
        </div>

        {/* 1. EMPLOYEE INFORMATION */}
        <EmployeeInfoSection
          employeeName={form.employeeName}
          staffId={form.staffId}
          department={form.department}
          position={form.position}
          dateOfEmployment={form.dateOfEmployment}
          reportingManager={form.reportingManager}
          onManagerChange={!effectiveIsReadOnly ? (v: string) => setForm({ ...form, reportingManager: v }) : undefined}
          heads={uniqueHeads}
          isReadOnly={effectiveIsReadOnly}
        />

        {/* 2. LEAVE DETAILS */}
        <FormSection title="2. LEAVE DETAILS">
          <FormRow label="2.1 Nature of Leave">
            <Select
              value={form.leaveType}
              onValueChange={(v: any) => setForm({ ...form, leaveType: v })}
              disabled={effectiveIsReadOnly}
            >
              <SelectTrigger className="h-8 text-xs">
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
          </FormRow>

          {form.leaveType === "parental" && (
            <FormRow label="2.1a Parental Leave Type">
              <Select
                value={form.parentalLeaveType}
                onValueChange={(v: any) => setForm({ ...form, parentalLeaveType: v })}
                disabled={effectiveIsReadOnly}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paternity">Paternity (7 days)</SelectItem>
                  <SelectItem value="maternity">Maternity (84 days)</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          )}

          <FormRow label="2.2 Start Date & End Date">
            <DateRangePicker
              startDate={form.startDate}
              endDate={form.endDate}
              onStartDateChange={(d: string) => setForm({ ...form, startDate: d })}
              onEndDateChange={(d: string) => setForm({ ...form, endDate: d })}
              disabled={effectiveIsReadOnly}
              maxDays={localLeaveBalance.totalAnnualLeave}
            />
          </FormRow>

          <FormRow label="2.3 Business Days Requested">
            <div className="flex items-center gap-2">
              <Input value={calculatedBusinessDays} disabled className="h-8 w-20 text-center font-bold" />
              <span className="text-xs text-gray-500">Days</span>
            </div>
          </FormRow>

          <FormRow label="2.4 Backup Person Name">
            <Input
              value={form.contactDuringLeave ? form.contactDuringLeave.split('|')[0] : ''}
              onChange={(e) => {
                const tel = form.contactDuringLeave ? form.contactDuringLeave.split('|')[1] : '';
                setForm({ ...form, contactDuringLeave: `${e.target.value}|${tel}` });
              }}
              disabled={effectiveIsReadOnly}
              placeholder="Name of person covering for you"
              className="h-8 text-xs"
            />
          </FormRow>

          <FormRow label="2.5 Backup Person Tel">
            <Input
              value={form.contactDuringLeave ? form.contactDuringLeave.split('|')[1] : ''}
              onChange={(e) => {
                const name = form.contactDuringLeave ? form.contactDuringLeave.split('|')[0] : '';
                setForm({ ...form, contactDuringLeave: `${name}|${e.target.value}` });
              }}
              disabled={effectiveIsReadOnly}
              placeholder="Telephone number"
              className="h-8 text-xs"
            />
          </FormRow>

          <FormRow label="2.6 Will you be outside the country?">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="radio"
                  checked={form.outsideCountry === "yes"}
                  onChange={() => setForm({ ...form, outsideCountry: "yes" })}
                  disabled={effectiveIsReadOnly}
                /> Yes
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="radio"
                  checked={form.outsideCountry === "no"}
                  onChange={() => setForm({ ...form, outsideCountry: "no" })}
                  disabled={effectiveIsReadOnly}
                /> No
              </label>
            </div>
          </FormRow>
        </FormSection>

        {/* 3. LEAVE BALANCE & SUPPORTING DOCS */}
        <FormSection title="3. LEAVE BALANCE & SIGNATURE">
          <FormRow label="3.1 Annual Entitlement">
            <Input value={localLeaveBalance.totalAnnualLeave} disabled className="h-8 w-20 bg-gray-50" />
          </FormRow>

          {(form.leaveType === "sick" || form.leaveType === "parental") && (
            <FormRow label="3.2 Supporting Document">
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
                    title="Upload Supporting Document"
                  />
                )}
                {form.supportingDocument && <p className="text-xs text-green-600">✓ {form.supportingDocument.name}</p>}
              </div>
            </FormRow>
          )}

          <FormRow label="3.3 Employee Signature">
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
                    title="Upload Signature"
                  />
                  {form.employeeSignatureUrl && <img src={form.employeeSignatureUrl} alt="sig" className="h-10 object-contain border" />}
                  <SingleDatePicker
                    value={form.signatureDate}
                    onChange={(d: string) => setForm({ ...form, signatureDate: d })}
                    label="Date"
                  />
                </>
              ) : (
                <div className="space-y-1">
                  {form.employeeSignatureUrl ? <img src={form.employeeSignatureUrl} alt="sig" className="h-10 object-contain" /> : <p className="text-xs italic">No signature</p>}
                  <p className="text-xs text-gray-500">{form.signatureDate || "Date not set"}</p>
                </div>
              )}
            </div>
          </FormRow>
        </FormSection>

        {/* 4. APPROVAL WORKFLOW */}
        <FormSection title="4. APPROVAL WORKFLOW">
          {isApprover ? (
            <ApproverApprovalSection
              title="Your Approval"
              approverRole={user?.role || "Approver"}
              approvalComments={approvalComments}
              onCommentsChange={setApprovalComments}
              approverSignature={approverSignature}
              onSignatureChange={setApproverSignature}
              isReadOnly={isReadOnly}
              requestId={requestId}
              onSignatureFileIdChange={setApproverSignatureFileId}
              hrUsers={uniqueHR}
              selectedHR={selectedHR}
              onHRChange={setSelectedHR}
              isHODLevel={user?.role === "head_of_department"}
            />
          ) : (
            <div className="space-y-4">
              <ApprovalSection
                number="4.1"
                title="Line Manager Approval"
                managerId={form.reportingManager}
                heads={uniqueHeads}
                isManagerSection={true}
              />
              <ApprovalSection
                number="4.2"
                title="HR Review"
              />
              <ApprovalSection
                number="4.3"
                title="Final Approval (CEO/MD)"
              />
            </div>
          )}
        </FormSection>

        <FormActions
          isSubmitting={isSubmitting}
          onSave={handleSaveAsDraft}
          onSubmit={handleSubmit}
          isApprover={isApprover}
          onApprove={() => onApprove?.({
            comments: approvalComments,
            signatureFile: approverSignature,
            signatureFileId: approverSignatureFileId,
            selectedHR: selectedHR,
          })}
          onReject={() => setShowRejectDialog(true)}
          isReadOnly={isReadOnly}
          isRequestApproved={isRequestApproved}
          isRequestRejected={isRequestRejected}
        />
      </div>

      {isApprover && (
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
              <DialogDescription>Please provide a reason for rejection.</DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={!rejectReason || isLoading}
                onClick={() => onReject?.(rejectReason)}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <FormFooter />
    </FormContainer>
  );
}

// Helper Components
function ApproverApprovalSection({
  title,
  approverRole,
  approvalComments,
  onCommentsChange,
  approverSignature,
  onSignatureChange,
  requestId,
  onSignatureFileIdChange,
  isReadOnly,
  hrUsers,
  selectedHR,
  onHRChange,
  isHODLevel
}: any) {
  return (
    <div className="space-y-4 border p-4 rounded bg-blue-50/30">
      <h3 className="text-sm font-bold text-blue-700">{title} ({approverRole})</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold block mb-1">Comments</label>
          <Textarea
            value={approvalComments}
            onChange={(e) => onCommentsChange(e.target.value)}
            disabled={isReadOnly}
            placeholder="Add comments..."
            className="text-xs"
          />
        </div>

        {isHODLevel && !isReadOnly && (
          <div>
            <label className="text-xs font-semibold block mb-1">Forward to HR</label>
            <Select value={selectedHR} onValueChange={onHRChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select HR officer" />
              </SelectTrigger>
              <SelectContent>
                {hrUsers.map((hr: any) => (
                  <SelectItem key={hr.id} value={String(hr.id)}>{hr.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold block mb-1">Signature</label>
          {!isReadOnly ? (
             <input
             type="file"
             onChange={(e) => onSignatureChange(e.target.files?.[0] || null)}
             className="text-xs"
             title="Upload Approver Signature"
           />
          ) : (
            <p className="text-xs italic">Signature on file</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ApprovalSection({ number, title, managerId, heads, isManagerSection }: any) {
  const managerName = heads?.find((h: any) => String(h.id) === managerId)?.name || "Pending Selection";

  return (
    <FormRow label={`${number} ${title}`}>
       <div className="flex flex-col gap-1">
         <p className="text-xs font-medium">{isManagerSection ? managerName : "Department Review"}</p>
         <p className="text-[10px] text-gray-500">Status: Pending</p>
       </div>
    </FormRow>
  );
}
