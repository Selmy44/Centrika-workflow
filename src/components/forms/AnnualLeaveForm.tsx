import { useState, useEffect } from "react";
import { Loader2, Download, Printer } from "lucide-react";
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
 * Annual Leave Form - Standard leave with minimal requirements
 * Sections: Employee Info, Leave Details, Leave Balance, Signatures
 */
export default function AnnualLeaveForm({ onSuccess }: Props) {
  const { user, isAuthenticated } = useAuth();
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    documentId: "",
    requestNumber: "",
    departmentHeader: "COMP",
    leaveType: "annual",
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
    contactDuringLeave: "",
    leaveDaysEntitled: "",
    leaveDaysTaken: "",
    leaveDaysRemaining: "",
    reportingManager: "",
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
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

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

      if (requestId) {
        await submitRequest.mutateAsync({
          id: requestId,
          initialApproverId: parseInt(form.reportingManager),
        });
      }

      toast.success("Annual leave request submitted successfully!");
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
          <h1 className="text-2xl font-bold text-blue-600">ANNUAL LEAVE REQUEST FORM</h1>
          <p className="text-sm text-gray-600 mt-2">Submit your annual leave request. Annual leave is paid time off for vacation.</p>
        </div>

        <div className="space-y-6">
          {/* 1. EMPLOYEE INFORMATION */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h2 className="text-lg font-bold text-blue-600 mb-4">1. EMPLOYEE INFORMATION</h2>
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
                  <SelectTrigger className="h-10 border-blue-300">
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
          <div className="border rounded-lg p-4 bg-blue-50">
            <h2 className="text-lg font-bold text-blue-600 mb-4">2. LEAVE DETAILS</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Duration *</label>
                <DateRangePicker
                  startDate={form.startDate}
                  endDate={form.endDate}
                  onStartDateChange={(date) => setForm({ ...form, startDate: date })}
                  onEndDateChange={(date) => setForm({ ...form, endDate: date })}
                  maxDays={18}
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Information During Leave</label>
                <Textarea
                  value={form.contactDuringLeave}
                  onChange={(e) => setForm({ ...form, contactDuringLeave: e.target.value })}
                  placeholder="Provide contact details or person covering for you"
                  className="min-h-20 border-blue-300"
                />
              </div>
            </div>
          </div>

          {/* 3. LEAVE BALANCE */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h2 className="text-lg font-bold text-blue-600 mb-4">3. LEAVE BALANCE (TO BE FILLED BY HR)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Annual Leave Days Entitled</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={form.leaveDaysEntitled}
                    onChange={(e) => setForm({ ...form, leaveDaysEntitled: e.target.value })}
                    className="border-blue-300 h-10"
                    placeholder="Days"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Days Already Taken</label>
                <Input
                  type="number"
                  value={form.leaveDaysTaken}
                  onChange={(e) => setForm({ ...form, leaveDaysTaken: e.target.value })}
                  className="border-blue-300 h-10"
                  placeholder="Days"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Days Under Request *</label>
                <Input
                  type="number"
                  value={form.leaveDaysRequested}
                  onChange={(e) => setForm({ ...form, leaveDaysRequested: e.target.value })}
                  className="border-blue-300 h-10"
                  placeholder="Days"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Remaining Leave Days</label>
                <Input
                  type="number"
                  value={form.leaveDaysRemaining}
                  disabled
                  className="bg-blue-100 border-blue-300 h-10"
                />
              </div>
            </div>
          </div>

          {/* 4. EMPLOYEE SIGNATURE */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h2 className="text-lg font-bold text-blue-600 mb-4">4. EMPLOYEE SIGNATURE</h2>
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
                  className="border border-blue-300 h-10 rounded px-2 w-full"
                />
                {form.employeeSignature && (
                  <p className="text-sm text-green-600 mt-2">✓ {form.employeeSignature.name} selected</p>
                )}
              </div>

              {form.employeeSignatureUrl && (
                <div className="p-3 border-2 border-dashed border-blue-300 rounded bg-blue-100">
                  <p className="text-sm font-semibold text-blue-600 mb-2">Signature Preview:</p>
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Annual Leave Request"
              )}
            </Button>
            <Button variant="outline" className="border-blue-300">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" className="border-blue-300">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
