import { useState, useEffect } from "react";
import { Loader2, Download, Printer, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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

interface Props {
  onSuccess?: () => void;
}

/**
 * Unpaid Leave Form - Special approval process, no pay during leave
 * Sections: Employee Info, Warning, Leave Details, Acknowledgment, Contact, Leave Balance, Signatures
 */
export default function UnpaidLeaveForm({ onSuccess }: Props) {
  const { user, isAuthenticated } = useAuth();
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acknowledgeUnpaid, setAcknowledgeUnpaid] = useState(false);

  const [form, setForm] = useState({
    documentId: "",
    requestNumber: "",
    departmentHeader: "COMP",
    leaveType: "unpaid",
    year: new Date().getFullYear().toString(),
    month: "",
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
    signatureDate: new Date().toISOString().split('T')[0],
  });

  const { data: heads = [] } = trpc.users.listHeads.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const uniqueHeads = Array.from(
    new Map(heads.map((h: any) => [h.id, h])).values()
  );

  const createLeave = trpc.requests.createLeaveRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();

  useEffect(() => {
    if (user && autoFillData) {
      setForm(prev => ({
        ...prev,
        employeeName: user.name || "",
        staffId: user.staffId || "",
        department: user.department?.name || "",
        position: user.position || "",
        dateOfEmployment: autoFillData.dateOfEmployment || "",
        reportingManager: autoFillData.managerId ? String(autoFillData.managerId) : "",
      }));
    }
  }, [user, autoFillData]);

  useEffect(() => {
    const entitled = parseInt(form.leaveDaysEntitled) || 0;
    const taken = parseInt(form.leaveDaysTaken) || 0;
    const requested = parseInt(form.leaveDaysRequested) || 0;
    const remaining = entitled - taken - requested;
    setForm(prev => ({ ...prev, leaveDaysRemaining: remaining.toString() }));
  }, [form.leaveDaysEntitled, form.leaveDaysTaken, form.leaveDaysRequested]);

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
      toast.error("Number of leave days must be greater than 0");
      return false;
    }
    if (!form.reasonForUnpaid.trim()) {
      toast.error("Please provide reason for unpaid leave");
      return false;
    }
    if (!acknowledgeUnpaid) {
      toast.error("You must acknowledge that this is unpaid leave");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

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
        await submitRequest.mutateAsync({
          id: requestId,
          initialApproverId: parseInt(form.reportingManager),
        });
      }

      toast.success("Unpaid leave request submitted successfully!");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="w-full p-6 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-amber-600">UNPAID LEAVE REQUEST FORM</h1>
          <p className="text-sm text-gray-600 mt-2">Submit your unpaid leave request. This type of leave is without pay and requires special approval.</p>
        </div>

        {/* IMPORTANT NOTICE */}
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-600 rounded">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-bold text-amber-900 mb-2">Important Notice - Unpaid Leave</h3>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>During unpaid leave, you will not receive salary or benefits</li>
                <li>Unpaid leave may affect your annual leave entitlements</li>
                <li>This request requires approval from multiple levels of management</li>
                <li>The organization reserves the right to approve or deny unpaid leave requests</li>
                <li>Extended unpaid leave may have implications on employment</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. EMPLOYEE INFORMATION */}
          <div className="border rounded-lg p-4 bg-amber-50">
            <h2 className="text-lg font-bold text-amber-600 mb-4">1. EMPLOYEE INFORMATION</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Name</label>
                <Input value={form.employeeName} disabled className="bg-white h-10" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Staff ID</label>
                <Input value={form.staffId} disabled className="bg-white h-10" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                <Input value={form.department} disabled className="bg-white h-10" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Position</label>
                <Input value={form.position} disabled className="bg-white h-10" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Employment</label>
                <Input type="date" value={form.dateOfEmployment} disabled className="bg-white h-10" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reporting Manager *</label>
                <Select value={form.reportingManager} onValueChange={(v) => setForm({ ...form, reportingManager: v })}>
                  <SelectTrigger className="h-10 border-amber-300">
                    <SelectValue placeholder="Select department head" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueHeads.map((head: any) => (
                      <SelectItem key={head.id} value={head.id.toString()}>
                        {head.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 2. LEAVE DETAILS */}
          <div className="border rounded-lg p-4 bg-amber-50">
            <h2 className="text-lg font-bold text-amber-600 mb-4">2. LEAVE DETAILS</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Duration *</label>
                <DateRangePicker
                  startDate={form.startDate}
                  endDate={form.endDate}
                  onStartDateChange={(date) => setForm({ ...form, startDate: date })}
                  onEndDateChange={(date) => setForm({ ...form, endDate: date })}
                  maxDays={30}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Will you be outside the country?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="yes"
                      checked={form.outsideCountry === "yes"}
                      onChange={(e) => setForm({ ...form, outsideCountry: e.target.value })}
                      className="w-4 h-4"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2">
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
              </div>
            </div>
          </div>

          {/* 3. REASON FOR UNPAID LEAVE */}
          <div className="border rounded-lg p-4 bg-amber-50">
            <h2 className="text-lg font-bold text-amber-600 mb-4">3. REASON FOR UNPAID LEAVE *</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Please Explain Your Reason</label>
              <Textarea
                value={form.reasonForUnpaid}
                onChange={(e) => setForm({ ...form, reasonForUnpaid: e.target.value })}
                placeholder="Please provide a detailed explanation for requesting unpaid leave. This will help management understand your situation and make an informed decision..."
                className="min-h-24 border-amber-300"
                required
              />
              <p className="text-xs text-gray-600 mt-2">This information will be reviewed by your department head, HR, and management.</p>
            </div>
          </div>

          {/* 4. CONTACT INFORMATION */}
          <div className="border rounded-lg p-4 bg-amber-50">
            <h2 className="text-lg font-bold text-amber-600 mb-4">4. CONTACT DURING LEAVE</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Information</label>
              <Textarea
                value={form.contactDuringLeave}
                onChange={(e) => setForm({ ...form, contactDuringLeave: e.target.value })}
                placeholder="Provide contact details or person covering for you during this period..."
                className="min-h-20 border-amber-300"
              />
            </div>
          </div>

          {/* 5. LEAVE BALANCE */}
          <div className="border rounded-lg p-4 bg-amber-50">
            <h2 className="text-lg font-bold text-amber-600 mb-4">5. LEAVE BALANCE (TO BE FILLED BY HR)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Days Entitled</label>
                <Input
                  type="number"
                  value={form.leaveDaysEntitled}
                  onChange={(e) => setForm({ ...form, leaveDaysEntitled: e.target.value })}
                  className="border-amber-300 h-10"
                  placeholder="Days"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Days Already Taken</label>
                <Input
                  type="number"
                  value={form.leaveDaysTaken}
                  onChange={(e) => setForm({ ...form, leaveDaysTaken: e.target.value })}
                  className="border-amber-300 h-10"
                  placeholder="Days"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unpaid Leave Days Requested *</label>
                <Input
                  type="number"
                  value={form.leaveDaysRequested}
                  onChange={(e) => setForm({ ...form, leaveDaysRequested: e.target.value })}
                  className="border-amber-300 h-10"
                  placeholder="Days"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Remaining Paid Leave Days</label>
                <Input
                  type="number"
                  value={form.leaveDaysRemaining}
                  disabled
                  className="bg-amber-100 border-amber-300 h-10"
                />
              </div>
            </div>
          </div>

          {/* 6. ACKNOWLEDGMENT */}
          <div className="border-2 border-amber-600 rounded-lg p-4 bg-amber-50">
            <h2 className="text-lg font-bold text-amber-600 mb-4">6. EMPLOYEE ACKNOWLEDGMENT *</h2>
            <label className="flex items-start gap-3 p-4 bg-white rounded border border-amber-300">
              <input
                type="checkbox"
                checked={acknowledgeUnpaid}
                onChange={(e) => setAcknowledgeUnpaid(e.target.checked)}
                className="w-5 h-5 mt-1 border-amber-300 rounded"
                required
              />
              <div>
                <p className="font-semibold text-amber-900">I acknowledge and understand that:</p>
                <ul className="text-sm text-amber-800 space-y-1 mt-2 list-disc list-inside">
                  <li>This leave will be unpaid and I will not receive salary during this period</li>
                  <li>I understand the implications of unpaid leave on my benefits and service record</li>
                  <li>I will resume normal duties on the scheduled return date</li>
                  <li>This request is subject to management approval</li>
                </ul>
              </div>
            </label>
          </div>

          {/* 7. EMPLOYEE SIGNATURE */}
          <div className="border rounded-lg p-4 bg-amber-50">
            <h2 className="text-lg font-bold text-amber-600 mb-4">7. EMPLOYEE SIGNATURE</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Your Signature</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      setForm({ ...form, employeeSignature: file });
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setForm(prev => ({
                          ...prev,
                          employeeSignatureUrl: event.target?.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="border border-amber-300 h-10 rounded px-2 w-full"
                />
                {form.employeeSignature && (
                  <p className="text-sm text-green-600 mt-2">✓ {form.employeeSignature.name} selected</p>
                )}
              </div>

              {form.employeeSignatureUrl && (
                <div className="p-3 border-2 border-dashed border-amber-300 rounded bg-amber-100">
                  <p className="text-sm font-semibold text-amber-600 mb-2">Signature Preview:</p>
                  <img src={form.employeeSignatureUrl} alt="signature" className="h-24 object-contain" />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Signature Date</label>
                <SingleDatePicker
                  value={form.signatureDate}
                  onChange={(date) => setForm({ ...form, signatureDate: date })}
                  label=""
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Unpaid Leave Request"
              )}
            </Button>
            <Button variant="outline" className="border-amber-300">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" className="border-amber-300">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
