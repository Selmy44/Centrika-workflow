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
 * Sick Leave Form - Requires medical documentation
 * Sections: Employee Info, Leave Details, Medical Info, Documents, Leave Balance, Signatures
 */
export default function SickLeaveForm({ onSuccess }: Props) {
  const { user, isAuthenticated } = useAuth();
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    documentId: "",
    requestNumber: "",
    departmentHeader: "COMP",
    leaveType: "sick",
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
    // Sick Leave Specific
    illnessDescription: "",
    visitedHospital: "no",
    hospitalName: "",
    doctorName: "",
    medicalDocuments: [] as File[],
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
        department: user.department || "",
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
    if (!form.illnessDescription.trim()) {
      toast.error("Please describe your illness");
      return false;
    }
    if (form.visitedHospital === "yes" && !form.hospitalName.trim()) {
      toast.error("Please provide hospital name");
      return false;
    }
    if (form.medicalDocuments.length === 0) {
      toast.error("Medical documentation is required for sick leave");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const reason = `Illness: ${form.illnessDescription}${form.visitedHospital === "yes" ? ` | Hospital: ${form.hospitalName}` : ""}`;

      const created = await createLeave.mutateAsync({
        title: `Sick Leave Request - ${form.documentId}`,
        leaveType: "sick" as any,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: reason,
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

      toast.success("Sick leave request submitted successfully!");
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
          <h1 className="text-2xl font-bold text-red-600">SICK LEAVE REQUEST FORM</h1>
          <p className="text-sm text-gray-600 mt-2">Submit your sick leave request. Medical documentation is required.</p>
        </div>

        <div className="space-y-6">
          {/* 1. EMPLOYEE INFORMATION */}
          <div className="border rounded-lg p-4 bg-red-50">
            <h2 className="text-lg font-bold text-red-600 mb-4">1. EMPLOYEE INFORMATION</h2>
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
                  <SelectTrigger className="h-10 border-red-300">
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
          <div className="border rounded-lg p-4 bg-red-50">
            <h2 className="text-lg font-bold text-red-600 mb-4">2. LEAVE DETAILS</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Duration *</label>
                <DateRangePicker
                  startDate={form.startDate}
                  endDate={form.endDate}
                  onStartDateChange={(date) => setForm({ ...form, startDate: date })}
                  onEndDateChange={(date) => setForm({ ...form, endDate: date })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Will you be outside the country?</label>
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

          {/* 3. MEDICAL INFORMATION */}
          <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-300">
          <div className="flex gap-2 mb-4">
            <AlertCircle className="text-yellow-600 shrink-0" size={20} />
              <div>
                <h2 className="text-lg font-bold text-red-600">3. MEDICAL INFORMATION *</h2>
                <p className="text-sm text-gray-600">Medical documentation is required for all sick leave requests</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description of Illness/Condition *</label>
                <Textarea
                  value={form.illnessDescription}
                  onChange={(e) => setForm({ ...form, illnessDescription: e.target.value })}
                  placeholder="Describe your illness or medical condition..."
                  className="min-h-20 border-red-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Did you visit a hospital or healthcare facility?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="yes"
                      checked={form.visitedHospital === "yes"}
                      onChange={(e) => setForm({ ...form, visitedHospital: e.target.value })}
                      className="w-4 h-4"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="no"
                      checked={form.visitedHospital === "no"}
                      onChange={(e) => setForm({ ...form, visitedHospital: e.target.value })}
                      className="w-4 h-4"
                    />
                    No
                  </label>
                </div>
              </div>

              {form.visitedHospital === "yes" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hospital/Facility Name *</label>
                    <Input
                      value={form.hospitalName}
                      onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                      placeholder="Name of hospital or healthcare facility"
                      className="border-red-300 h-10"
                      required={form.visitedHospital === "yes"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Doctor/Consultant Name</label>
                    <Input
                      value={form.doctorName}
                      onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                      placeholder="Name of attending doctor"
                      className="border-red-300 h-10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Medical Documentation (Medical Report, Prescription, etc.) *</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files) {
                      setForm({ ...form, medicalDocuments: Array.from(e.target.files) });
                    }
                  }}
                  className="border border-red-300 h-10 rounded px-2 w-full"
                  required
                />
                {form.medicalDocuments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-green-600 font-semibold">✓ {form.medicalDocuments.length} file(s) uploaded:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {form.medicalDocuments.map((doc, idx) => (
                        <li key={idx} className="ml-4">• {doc.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. CONTACT INFORMATION */}
          <div className="border rounded-lg p-4 bg-red-50">
            <h2 className="text-lg font-bold text-red-600 mb-4">4. CONTACT DURING LEAVE</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Information</label>
              <Textarea
                value={form.contactDuringLeave}
                onChange={(e) => setForm({ ...form, contactDuringLeave: e.target.value })}
                placeholder="How can you be contacted during your absence?"
                className="min-h-20 border-red-300"
              />
            </div>
          </div>

          {/* 5. LEAVE BALANCE */}
          <div className="border rounded-lg p-4 bg-red-50">
            <h2 className="text-lg font-bold text-red-600 mb-4">5. LEAVE BALANCE (TO BE FILLED BY HR)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sick Leave Days Entitled</label>
                <Input
                  type="number"
                  value={form.leaveDaysEntitled}
                  onChange={(e) => setForm({ ...form, leaveDaysEntitled: e.target.value })}
                  className="border-red-300 h-10"
                  placeholder="Days"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Days Already Taken</label>
                <Input
                  type="number"
                  value={form.leaveDaysTaken}
                  onChange={(e) => setForm({ ...form, leaveDaysTaken: e.target.value })}
                  className="border-red-300 h-10"
                  placeholder="Days"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Days Under Request *</label>
                <Input
                  type="number"
                  value={form.leaveDaysRequested}
                  onChange={(e) => setForm({ ...form, leaveDaysRequested: e.target.value })}
                  className="border-red-300 h-10"
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
                  className="bg-red-100 border-red-300 h-10"
                />
              </div>
            </div>
          </div>

          {/* 6. EMPLOYEE SIGNATURE */}
          <div className="border rounded-lg p-4 bg-red-50">
            <h2 className="text-lg font-bold text-red-600 mb-4">6. EMPLOYEE SIGNATURE</h2>
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
                  className="border border-red-300 h-10 rounded px-2 w-full"
                />
                {form.employeeSignature && (
                  <p className="text-sm text-green-600 mt-2">✓ {form.employeeSignature.name} selected</p>
                )}
              </div>

              {form.employeeSignatureUrl && (
                <div className="p-3 border-2 border-dashed border-red-300 rounded bg-red-100">
                  <p className="text-sm font-semibold text-red-600 mb-2">Signature Preview:</p>
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
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Sick Leave Request"
              )}
            </Button>
            <Button variant="outline" className="border-red-300">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" className="border-red-300">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
