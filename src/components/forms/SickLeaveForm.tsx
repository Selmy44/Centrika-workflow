"use client";

import { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, AlertCircle } from "lucide-react";
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
  onClose?: () => void;
  onBack?: () => void;
}

/**
 * Sick Leave Form - Professional document-style design
 * Matches CarRequestForm / ExpenditureRequestForm / AssetRequestForm layout
 */
export default function SickLeaveForm({ onSuccess, onClose, onBack }: Props) {
  const { user, isAuthenticated } = useAuth();
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    documentId: "",
    requestNumber: "",
    departmentHeader: "COMP",
    leaveType: "sick",
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
    signatureDate: new Date().toISOString().split("T")[0],
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

  useEffect(() => {
    if (user && autoFillData) {
      const sequence = String(Math.floor(Math.random() * 10000)).padStart(5, "0");
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
      const docId = `SL-${new Date().getFullYear()}-${currentMonth}-${sequence}`;

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

  useEffect(() => {
    const entitled = parseInt(form.leaveDaysEntitled) || 0;
    const taken = parseInt(form.leaveDaysTaken) || 0;
    const requested = parseInt(form.leaveDaysRequested) || 0;
    const remaining = entitled - taken - requested;
    setForm((prev) => ({ ...prev, leaveDaysRemaining: remaining.toString() }));
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

  const handleSubmit = async (submit: boolean) => {
    if (submit && !validate()) return;

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

      if (submit && requestId) {
        await submitRequest.mutateAsync({
          id: requestId,
          initialApproverId: parseInt(form.reportingManager),
        });
      }

      toast.success(submit ? "Sick leave request submitted successfully!" : "Draft saved");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="w-full bg-white text-black px-4 leave-form-container relative">

      {/* CLOSE/BACK BUTTON */}
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
        {/* ===== HEADER WITH LOGO AND CONTACT INFO ===== */}
        <div className="flex justify-between items-start px-6 py-3 gap-8">
          <div className="shrink-0">
            <img
              src="/logo/centrikaLogo.png"
              alt="Centrika Logo"
              className="h-20 w-auto"
            />
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

        {/* ===== TITLE BAR (GOLDEN/YELLOW) ===== */}
        <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide uppercase">
          Sick Leave Request Form
        </div>

        {/* ===== REQUEST HEADER SECTION ===== */}
        <div className="grid grid-cols-5 gap-3 px-6 py-3 text-sm items-end">
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-xs">Name of Department</p>
            <div className="flex gap-0 items-center">
              <span className="text-blue-600 font-bold text-xs whitespace-nowrap">CTK - </span>
              <Input
                value={form.department}
                className="w-full h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed border-l-0"
                disabled
              />
            </div>
          </div>
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-xs">Nature of Leave</p>
            <Input
              value="Sick Leave"
              className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Year</p>
            <Input
              value={form.year}
              className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Month</p>
            <Input
              value={form.month}
              className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Document ID</p>
            <Input
              value={form.documentId}
              className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        {/* ===== REQUEST DETAILS ===== */}
        <div className="border-t border-blue-400">
          <div className="bg-blue-600 text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

          {/* 1. EMPLOYEE INFORMATION */}
          <Section title="1. EMPLOYEE INFORMATION">
            <Row label="1.1 Request Number">
              <Input
                value={form.documentId}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="1.2 Employee Full Name">
              <Input
                value={form.employeeName}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="1.3 Date of Employment">
              <Input
                type="date"
                value={form.dateOfEmployment}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="1.4 Employee / Staff ID">
              <Input
                value={form.staffId}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="1.5 Department">
              <Input
                value={form.department}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="1.6 Position / Title">
              <Input
                value={form.position}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
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
              />
            </Row>
            <Row label="2.2 Number of Leave Days Requested">
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="1"
                  value={form.leaveDaysRequested}
                  onChange={(e) => setForm({ ...form, leaveDaysRequested: e.target.value })}
                  placeholder="0"
                  className="border-blue-300 h-7 text-xs w-24"
                />
                <span className="text-xs font-medium text-gray-600">Day(s)</span>
              </div>
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

          {/* 3. MEDICAL INFORMATION */}
          <Section title="3. MEDICAL INFORMATION">
            {/* Important notice banner */}
            <div className="bg-yellow-50 px-4 py-2 border-b border-blue-400 flex items-center gap-2">
              <AlertCircle size={14} className="text-yellow-600 shrink-0" />
              <span className="text-[10px] text-yellow-700 font-semibold">Medical documentation is required for all sick leave requests</span>
            </div>
            <Row label="3.1 Description of Illness *">
              <Textarea
                value={form.illnessDescription}
                onChange={(e) => setForm({ ...form, illnessDescription: e.target.value })}
                placeholder="Describe your illness or medical condition..."
                className="min-h-20 border-blue-300 text-xs"
                required
              />
            </Row>
            <Row label="3.2 Visited Hospital / Facility?">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    value="yes"
                    checked={form.visitedHospital === "yes"}
                    onChange={(e) => setForm({ ...form, visitedHospital: e.target.value })}
                    className="w-4 h-4"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-xs">
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
            </Row>
            {form.visitedHospital === "yes" && (
              <>
                <Row label="3.3 Hospital / Facility Name *">
                  <Input
                    value={form.hospitalName}
                    onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                    placeholder="Name of hospital or healthcare facility"
                    className="border-blue-300 h-7 text-xs"
                    required
                  />
                </Row>
                <Row label="3.4 Doctor / Consultant Name">
                  <Input
                    value={form.doctorName}
                    onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                    placeholder="Name of attending doctor"
                    className="border-blue-300 h-7 text-xs"
                  />
                </Row>
              </>
            )}
            <Row label={`3.${form.visitedHospital === "yes" ? "5" : "3"} Medical Documents *`}>
              <div className="space-y-2 py-1">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files) {
                      setForm({ ...form, medicalDocuments: Array.from(e.target.files) });
                    }
                  }}
                  className="text-xs"
                  required
                />
                {form.medicalDocuments.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-green-600 font-semibold">✓ {form.medicalDocuments.length} file(s) uploaded:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {form.medicalDocuments.map((doc, idx) => (
                        <li key={idx} className="ml-3">• {doc.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Row>
          </Section>

          {/* 4. CONTACT DURING LEAVE */}
          <Section title="4. CONTACT DURING LEAVE">
            <Row label="4.1 Contact Information">
              <Textarea
                value={form.contactDuringLeave}
                onChange={(e) => setForm({ ...form, contactDuringLeave: e.target.value })}
                placeholder="How can you be contacted during your absence?"
                className="min-h-20 border-blue-300 text-xs"
              />
            </Row>
          </Section>

          {/* 5. LEAVE BALANCE */}
          <Section title="5. LEAVE BALANCE (TO BE FILLED BY HR)">
            <Row label="5.1 Sick Leave Days Entitled">
              <Input
                type="number"
                value={form.leaveDaysEntitled}
                onChange={(e) => setForm({ ...form, leaveDaysEntitled: e.target.value })}
                className="border-blue-300 h-7 text-xs"
                placeholder="Days"
              />
            </Row>
            <Row label="5.2 Leave Days Already Taken">
              <Input
                type="number"
                value={form.leaveDaysTaken}
                onChange={(e) => setForm({ ...form, leaveDaysTaken: e.target.value })}
                className="border-blue-300 h-7 text-xs"
                placeholder="Days"
              />
            </Row>
            <Row label="5.3 Leave Days Under Request">
              <Input
                type="number"
                value={form.leaveDaysRequested}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="5.4 Remaining Leave Days">
              <Input
                type="number"
                value={form.leaveDaysRemaining}
                disabled
                className="border-blue-300 h-7 text-xs bg-blue-50 cursor-not-allowed !text-black font-bold"
              />
            </Row>
          </Section>

          {/* 6. INITIAL APPROVAL */}
          <Section title="6. INITIAL APPROVAL">
            <Row label="6.1 Reporting Manager / HOD">
              <Select
                value={form.reportingManager}
                onValueChange={(v) => setForm({ ...form, reportingManager: v })}
              >
                <SelectTrigger className="w-full h-10 border-blue-300 bg-white text-black font-medium focus:ring-blue-500 mt-1 mb-1">
                  <SelectValue placeholder="-- Select Department Head --" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  {uniqueHeads.map((head: any) => (
                    <SelectItem key={head.id} value={String(head.id)} className="focus:bg-blue-500 focus:text-white">
                      {head.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          </Section>

          {/* 7. EMPLOYEE SIGNATURE */}
          <Section title="7. EMPLOYEE SIGNATURE">
            <Row label="7.1 Upload Your Signature">
              <div className="space-y-2 py-1">
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      setForm({ ...form, employeeSignature: file });
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setForm((prev) => ({
                          ...prev,
                          employeeSignatureUrl: event.target?.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs"
                />
                {form.employeeSignature && (
                  <p className="text-xs text-green-600">✓ {form.employeeSignature.name} selected</p>
                )}
                {form.employeeSignatureUrl && (
                  <div className="p-2 border border-dashed border-blue-300 rounded bg-blue-50 inline-block">
                    <img src={form.employeeSignatureUrl} alt="signature" className="h-16 object-contain" />
                  </div>
                )}
              </div>
            </Row>
            <Row label="7.2 Signature Date">
              <SingleDatePicker
                value={form.signatureDate}
                onChange={(date) => setForm({ ...form, signatureDate: date })}
                label=""
              />
            </Row>
          </Section>
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-blue-400 bg-gray-50 gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => window.print()}
              className="border-blue-400 text-blue-600"
            >
              <Printer size={16} className="mr-1" /> Print
            </Button>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                toast.info("Download functionality requires backend PDF generation");
              }}
              className="border-blue-400 text-blue-600"
            >
              <Download size={16} className="mr-1" /> Download
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="border-blue-400"
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
    <div className="border-t border-blue-400">
      <div className="bg-blue-500 text-white font-bold px-4 py-2 text-sm">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[220px_1fr] border-b border-blue-400">
      <div className="px-3 py-2 font-medium border-r border-blue-400 bg-blue-100 text-blue-700 text-xs">
        {label}
      </div>
      <div className="px-3 py-1">{children}</div>
    </div>
  );
}
