"use client";

import { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";
import { getLeaveTypeConfig } from "@/lib/leaveTypeConfig";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * LeaveRequestForm - Fully Functional Leave Request Form
 * Connects to backend, stores all data, and submits to chosen Head of Department
 */

function calculateBusinessDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  let businessDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return businessDays;
}

interface Props {
  onSuccess?: () => void;
  onClose?: () => void;
  onBack?: () => void;
  isApprover?: boolean;
  requestData?: any;
  onApprove?: (data: any) => void;
  onReject?: (reason: string) => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
  leaveType?: string;
}

export default function LeaveRequestForm({ onSuccess, onClose, onBack, isApprover = false, requestData, onApprove, onReject, isLoading = false, isReadOnly = false, leaveType }: Props) {
  const { user, isAuthenticated } = useAuth();
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedHR, setSelectedHR] = useState("");
  const [approvalComments, setApprovalComments] = useState("");
  const [approverSignature, setApproverSignature] = useState<File | null>(null);
  const [approverSignatureUrl, setApproverSignatureUrl] = useState<string>("");
  const [approverSignatureFileId, setApproverSignatureFileId] = useState<number | undefined>();

  const isRequestApproved = requestData?.status === "approved";
  const isRequestRejected = requestData?.status === "rejected";
  const effectiveIsReadOnly = isReadOnly || isRequestApproved || isRequestRejected || isApprover;
  const approvalSectionIsReadOnly = isReadOnly || isRequestApproved || isRequestRejected;

  const { data: hrUsers = [] } = trpc.users.getHRUsers.useQuery(undefined, {
    enabled: isApprover && user?.role === "head_of_department",
    staleTime: Infinity,
  });

  const [form, setForm] = useState({
    documentId: "",
    requestNumber: "",
    departmentHeader: "COMP",
    leaveType: leaveType || "annual",
    parentalLeaveType: "" as "paternity" | "maternity" | "",
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
    reason: "",
    outsideCountry: "no",
    contactDuringLeave: "",
    leaveDaysEntitled: getLeaveTypeConfig(leaveType || "annual").entitlementDays.toString(),
    leaveDaysTaken: "",
    leaveDaysRemaining: "",
    backupName: "",
    reportingManager: "",
    employeeSignature: null as File | null,
    employeeSignatureUrl: "" as string,
    managerSignature: null as File | null,
    managerSignatureUrl: "" as string,
    additionalDocuments: [] as File[],
    supportingDocument: null as File | null,
    supportingDocumentUrl: "" as string,
    leaveReason: "",
    signatureDate: new Date().toISOString().split('T')[0],
  });

  console.log("LeaveRequestForm - form data:", form);
  console.log("LeaveRequestForm - isApprover:", isApprover);

  const getHODName = (hodId: string): string => {
    if (!hodId || !uniqueHeads.length) return "Department Head";
    const hod = uniqueHeads.find((h: any) => String(h.id) === String(hodId));
    return hod?.name || "Department Head";
  };

  // ✅ FIX: Handler to update both approverSignature state AND form.managerSignatureUrl when HOD uploads
  const handleHODSignatureChange = (file: File | null) => {
    setApproverSignature(file);
    // If file is cleared, also clear the form state
    if (!file) {
      setForm(prev => ({ ...prev, managerSignatureUrl: "" }));
    }
  };

  const { data: heads = [] } = trpc.users.listHeads.useQuery(undefined, {
    staleTime: Infinity, // Cache forever - heads don't change often
    gcTime: Infinity, // Keep in cache indefinitely
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false, // Don't refetch on mount
    retry: 1,
  });

  const uniqueHeads = Array.from(
    new Map(heads.map((h: any) => [h.id, h])).values()
  );

  const createLeave = trpc.requests.createLeaveRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();
  const storeFormData = trpc.requests.storeLeaveFormData.useMutation();
  const uploadEmployeeSignature = trpc.requests.uploadEmployeeSignature.useMutation();

  const { data: leaveBalance, isLoading: isLoadingBalance } = trpc.requests.getLeaveBalance.useQuery(undefined, {
    enabled: !isApprover && !isReadOnly, // Only fetch for employees creating/editing forms
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes for live updates
  });

  const getFormData = trpc.requests.getLeaveFormData.useQuery(
    { requestId: requestData?.id || 0 },
    {
      enabled: (isApprover || isReadOnly) && requestData?.id !== undefined && requestData?.id !== null && requestData?.id !== 0,
      staleTime: 0, // Always consider data stale - this is critical for showing the correct form
      gcTime: 1000 * 60, // Keep in cache for 1 minute only
      refetchOnWindowFocus: false,
      refetchOnMount: true, // CRITICAL: Always fetch fresh data when request ID changes
    }
  );

  // NEW: Fetch attachments for this request
  const getAttachments = trpc.requests.getAttachments.useQuery(
    { requestId: requestData?.id || 0 },
    {
      enabled: requestData?.id !== undefined && requestData?.id !== null && requestData?.id !== 0,
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  // NEW: Fetch user's previous approved leave requests
  const userRequests = trpc.requests.listUserRequests.useQuery(undefined, {
    enabled: !isApprover && !isReadOnly,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const [calculatedBusinessDays, setCalculatedBusinessDays] = useState(0);

  useEffect(() => {
    console.log("[LeaveRequestForm] useEffect trigger - isApprover:", isApprover, "isReadOnly:", isReadOnly, "requestData.id:", requestData?.id);
    console.log("[LeaveRequestForm] Query Status:", {
      isLoading: getFormData.isLoading,
      isError: getFormData.isError,
      error: getFormData.error,
      data: getFormData.data ? "PRESENT" : "EMPTY",
      dataKeys: getFormData.data ? Object.keys(getFormData.data) : [],
    });
  }, [isApprover, isReadOnly, requestData?.id]);

  // Populates form for approvers/read-only views
  useEffect(() => {
    if (requestData && (isApprover || isReadOnly)) {
      if (getFormData.isLoading) {
        return; // Wait for data to be fetched
      }

      // CRITICAL: Only use getFormData if it exists and has the right requestId
      // If getFormData is from a different request due to caching, use requestData instead
      let sourceData = requestData;

      if (getFormData.data && getFormData.data.documentId) {
        // Double-check: Verify the form data is actually for THIS request
        if (getFormData.data.requestId === requestData?.id) {
          // Form data is for the correct request, use it
          sourceData = getFormData.data;
        } else {
          // Form data is from a different request somehow - log warning and use requestData
          console.warn("[FormPopulation] CRITICAL: Form data requestId mismatch!", {
            expectedRequestId: requestData?.id,
            actualRequestId: getFormData.data.requestId,
            formLeaveType: getFormData.data.leaveType,
          });
          // Use requestData fallback
          sourceData = requestData;
        }
      }

      if (!sourceData) {
        console.warn("[FormPopulation] WARNING: No source data available for request", requestData?.id);
        return; // No data to populate the form
      }

      // Additional safety check: Log the form type to detect wrong forms being shown
      console.log("[FormPopulation] Loading form for requestId:", requestData?.id, "leaveType:", sourceData.leaveType, "employeeName:", sourceData.employeeName);

      const employeeSignatureUrl = sourceData.employeeSignatureUrl || sourceData.leaveSignatures?.employeeSignature?.fileUrl || "";
      const managerSignatureUrl = sourceData.managerSignatureUrl || sourceData.leaveSignatures?.managerSignature?.fileUrl || "";

      setForm({
        documentId: sourceData.documentId || "",
        requestNumber: sourceData.requestNumber || "",
        departmentHeader: sourceData.departmentHeader || "COMP",
        leaveType: sourceData.leaveType || "annual",
        parentalLeaveType: sourceData.parentalLeaveType || "",
        year: sourceData.year || new Date().getFullYear().toString(),
        month: sourceData.month || "",
        employeeName: sourceData.employeeName || "",
        dateOfEmployment: sourceData.dateOfEmployment || "",
        staffId: sourceData.staffId || "",
        department: sourceData.department || "",
        position: sourceData.position || "",
        startDate: sourceData.startDate || "",
        endDate: sourceData.endDate || "",
        leaveDaysRequested: sourceData.leaveDaysRequested || "",
        reason: sourceData.reason || "",
        outsideCountry: sourceData.outsideCountry || "no",
        contactDuringLeave: sourceData.contactDuringLeave || "",
        leaveDaysEntitled: sourceData.leaveDaysEntitled || "18",
        leaveDaysTaken: sourceData.leaveDaysTaken || "0",
        leaveDaysRemaining: sourceData.leaveDaysRemaining || "18",
        backupName: sourceData.backupName || "",
        reportingManager: sourceData.reportingManager || "",
        employeeSignature: null,
        employeeSignatureUrl: employeeSignatureUrl,
        managerSignature: null,
        managerSignatureUrl: managerSignatureUrl,
        additionalDocuments: sourceData.additionalDocuments || [],
        supportingDocument: null,
        supportingDocumentUrl: sourceData.supportingDocumentUrl || "",
        leaveReason: sourceData.leaveReason || "",
        signatureDate: sourceData.signatureDate || new Date().toISOString().split('T')[0],
      });

      if (sourceData.approverSignatureUrl) {
        setApproverSignatureUrl(sourceData.approverSignatureUrl);
      }

      if (sourceData.approvalComments) {
        setApprovalComments(sourceData.approvalComments);
      }
    }
  }, [isApprover, isReadOnly, requestData, getFormData.data, getFormData.isLoading]);

  // Populates form for employees creating a new request (only on first mount)
  useEffect(() => {
    if (user && isAuthenticated && !isApprover && !isReadOnly && !form.documentId) {
      const sequence = String(Math.floor(Math.random() * 10000)).padStart(5, '0');
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      const docId = `LR-${new Date().getFullYear()}-${currentMonth}-${sequence}`;

      const leaveTypeToUse = leaveType || form.leaveType;
      const config = getLeaveTypeConfig(leaveTypeToUse);
      const defaultEntitledDays = config.entitlementDays;

      const entitledDays = Math.round((leaveTypeToUse === "annual" && leaveBalance?.annualLeaveEntitled ? leaveBalance.annualLeaveEntitled : defaultEntitledDays));
      const takenDays = Math.round(leaveTypeToUse === "annual" && leaveBalance?.annualLeaveTaken ? leaveBalance.annualLeaveTaken : 0);
      const remainingDays = Math.round((leaveTypeToUse === "annual" && leaveBalance?.annualLeaveRemaining ? leaveBalance.annualLeaveRemaining : defaultEntitledDays));

      setForm(prev => ({
        ...prev,
        leaveType: leaveTypeToUse,
        employeeName: autoFillData.employeeName || user.name || "",
        documentId: docId,
        requestNumber: docId,
        year: new Date().getFullYear().toString(),
        month: currentMonth,
        department: autoFillData.department || "",
        position: autoFillData.position || "",
        staffId: autoFillData.staffId || "",
        dateOfEmployment: autoFillData.dateOfEmployment || "",
        reportingManager: autoFillData.managerId ? String(autoFillData.managerId) : "",
        leaveDaysEntitled: entitledDays.toString(),
        leaveDaysTaken: takenDays.toString(),
        leaveDaysRemaining: remainingDays.toString(),
      }));
    }
  }, []) // Only run once on mount

  // NEW: Load attachment URLs from database (for HOD signatures)
  useEffect(() => {
    if (getAttachments.data && getAttachments.data.length > 0) {
      const attachments = getAttachments.data;

      // Map attachments by type
      for (const attachment of attachments) {
        if (attachment.type === "manager_signature") {
          // Update form state with manager/HOD signature
          setForm(prev => ({ ...prev, managerSignatureUrl: attachment.fileUrl }));
        } else if (attachment.type === "employee_signature") {
          // Update form state with employee signature
          setForm(prev => ({ ...prev, employeeSignatureUrl: attachment.fileUrl }));
        }
      }
    }
  }, [getAttachments.data]);

  useEffect(() => {
    const entitled = parseInt(form.leaveDaysEntitled) || 0;
    const taken = parseInt(form.leaveDaysTaken) || 0;
    const requested = parseInt(form.leaveDaysRequested) || 0;
    const remaining = entitled - taken - requested;
    setForm(prev => ({ ...prev, leaveDaysRemaining: remaining.toString() }));
  }, [form.leaveDaysEntitled, form.leaveDaysTaken, form.leaveDaysRequested]);

  useEffect(() => {
    if (form.startDate && form.endDate) {
      const businessDays = calculateBusinessDays(form.startDate, form.endDate);
      setCalculatedBusinessDays(businessDays);

      setForm(prev => ({ ...prev, leaveDaysRequested: businessDays.toString() }));
    }
  }, [form.startDate, form.endDate]);

  // Update leave entitlement when parental leave type is selected
  useEffect(() => {
    if (form.leaveType === "parental") {
      // For parental leave, only update if a type is actually selected
      if (form.parentalLeaveType === "paternity") {
        setForm(prev => ({
          ...prev,
          leaveDaysEntitled: "7"
        }));
      } else if (form.parentalLeaveType === "maternity") {
        setForm(prev => ({
          ...prev,
          leaveDaysEntitled: "84"
        }));
      } else {
        // No parental type selected yet - show 0
        setForm(prev => ({
          ...prev,
          leaveDaysEntitled: "0"
        }));
      }
    } else if (form.leaveType !== "parental") {
      // For non-parental leaves, use default from config
      const config = getLeaveTypeConfig(form.leaveType);
      setForm(prev => ({
        ...prev,
        leaveDaysEntitled: config.entitlementDays.toString()
      }));
    }
  }, [form.leaveType, form.parentalLeaveType]);

  // ✅ NEW: Sync approverSignatureUrl to form.managerSignatureUrl when HOD uploads signature
  useEffect(() => {
    if (isApprover && user?.role === "head_of_department" && approverSignatureUrl) {
      setForm(prev => ({ ...prev, managerSignatureUrl: approverSignatureUrl }));
    }
  }, [approverSignatureUrl, isApprover, user?.role]);

  /**
   * Calculate annual leave balance based on employment date (LOCAL CALCULATION)
   * Mirrors backend logic to provide immediate UI feedback
   * Formula:
   * - During first year: Employee accumulates 1.5 days per month
   * - After 1 year: Employee gets 18 days base + continues accumulating 1.5 days per additional month
   */
  const calculateLocalLeaveBalance = (dateOfEmployment: string | null | undefined) => {
    if (!dateOfEmployment || dateOfEmployment.trim() === "") {
      return {
        totalAnnualLeave: 0,
        monthsEmployed: 0,
        yearsEmployed: 0,
        completedFullYear: false,
        baseEntitlement: 0,
        accruedSinceFirstYear: 0,
        isEligible: false,
      };
    }

    try {
      const empDate = new Date(dateOfEmployment);
      const today = new Date();

      if (isNaN(empDate.getTime()) || empDate > today) {
        return {
          totalAnnualLeave: 0,
          monthsEmployed: 0,
          yearsEmployed: 0,
          completedFullYear: false,
          baseEntitlement: 0,
          accruedSinceFirstYear: 0,
          isEligible: false,
        };
      }

      // Calculate months and years employed
      const monthsDiff = (today.getFullYear() - empDate.getFullYear()) * 12 +
        (today.getMonth() - empDate.getMonth());

      const completeMonths = Math.floor(monthsDiff);
      const completedFullYear = completeMonths >= 12;

      const yearsEmployed = Math.floor(completeMonths / 12);
      const monthsInCurrentYear = completeMonths % 12;

      let totalAnnualLeave = 0;
      let baseEntitlement = 0;
      let accruedSinceFirstYear = 0;

      if (completedFullYear) {
        baseEntitlement = 18;
        accruedSinceFirstYear = (completeMonths - 12) * 1.5;
        totalAnnualLeave = baseEntitlement + accruedSinceFirstYear;
      } else {
        baseEntitlement = 0;
        accruedSinceFirstYear = completeMonths * 1.5;
        totalAnnualLeave = accruedSinceFirstYear;
      }

      return {
        totalAnnualLeave: parseFloat(totalAnnualLeave.toFixed(2)),
        monthsEmployed: completeMonths,
        yearsEmployed,
        completedFullYear,
        baseEntitlement,
        accruedSinceFirstYear: parseFloat(accruedSinceFirstYear.toFixed(2)),
        isEligible: completedFullYear,
      };
    } catch (error) {
      console.error("[calculateLocalLeaveBalance] Error:", error);
      return {
        totalAnnualLeave: 0,
        monthsEmployed: 0,
        yearsEmployed: 0,
        completedFullYear: false,
        baseEntitlement: 0,
        accruedSinceFirstYear: 0,
        isEligible: false,
      };
    }
  };

  // Calculate local leave balance based on current form employment date
  const localLeaveBalance = calculateLocalLeaveBalance(form.dateOfEmployment);

  const validate = () => {
    if (!form.reportingManager) {
      toast.error("Please select a reporting manager (Head of Department)");
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

    // Validate sick leave requirements
    if (form.leaveType === "sick") {
      // Check for supporting document
      if (!form.supportingDocument && !form.supportingDocumentUrl) {
        toast.error("Medical certificate or hospital papers are required for sick leave");
        return false;
      }

      const requestedDays = parseInt(form.leaveDaysRequested) || 0;

      // Check if requesting more than 5 days
      if (requestedDays > 5) {
        // Require a note explaining why more than 5 days are needed
        if (!form.leaveReason?.trim()) {
          toast.error("For sick leave requests over 5 days, you must provide a detailed explanation of why you need more than 5 days");
          return false;
        }
      }
    }

    // Validate annual leave max days
    if (form.leaveType === "annual") {
      // Check employment duration - need at least 1 year
      if (form.dateOfEmployment) {
        const employmentDate = new Date(form.dateOfEmployment);
        const today = new Date();
        const employmentDurationDays = Math.floor((today.getTime() - employmentDate.getTime()) / (1000 * 60 * 60 * 24));
        const employmentDurationMonths = Math.floor(employmentDurationDays / 30);

        if (employmentDurationDays < 365) { // Less than 1 year
          toast.error(`You are not yet eligible for annual leave. You need to be employed for at least 1 year. You have been employed for ${employmentDurationMonths} month(s). Please try again after completing 1 year of service.`);
          return false;
        }
      }

      const requestedDays = parseInt(form.leaveDaysRequested) || 0;
      if (requestedDays > 18) {
        toast.error("Annual leave is limited to 18 days per request. Please adjust your dates or apply for Unpaid Leave");
        return false;
      }
    }

    // Validate parental leave (paternity or maternity via dropdown)
    if (form.leaveType === "parental") {
      if (!form.parentalLeaveType) {
        toast.error("Please select whether you are requesting Paternity or Maternity leave");
        return false;
      }

      const requestedDays = parseInt(form.leaveDaysRequested) || 0;

      if (form.parentalLeaveType === "paternity") {
        if (requestedDays > 7) {
          toast.error("Paternity leave is limited to 7 days. Please adjust your dates or contact your Head of Department");
          return false;
        }
      } else if (form.parentalLeaveType === "maternity") {
        if (requestedDays > 84) {
          toast.error("Maternity leave is limited to 12 weeks (84 days). Please adjust your dates or contact your Head of Department");
          return false;
        }
      }
    }

    // OLD VALIDATION: Validate paternity leave (kept for backward compatibility with existing data)
    if (form.leaveType === "paternity") {
      const requestedDays = parseInt(form.leaveDaysRequested) || 0;
      if (requestedDays > 7) {
        toast.error("Paternity leave is limited to 7 days. Please adjust your dates or contact your Head of Department");
        return false;
      }
    }

    // OLD VALIDATION: Validate maternity leave (kept for backward compatibility with existing data)
    if (form.leaveType === "maternity") {
      const requestedDays = parseInt(form.leaveDaysRequested) || 0;
      if (requestedDays > 84) {
        toast.error("Maternity leave is limited to 12 weeks (84 days). Please adjust your dates or contact your Head of Department");
        return false;
      }
    }

    // ANNUAL LEAVE SPECIFIC VALIDATION - Only check leave balance for annual leave
    if (form.leaveType === "annual") {
      // Use actual leaveBalance from database for accurate validation
      const requestedDays = parseInt(form.leaveDaysRequested) || 0;
      const actualRemainingDays = Math.round(leaveBalance?.annualLeaveRemaining || 18);
      const entitledDays = Math.round(leaveBalance?.annualLeaveEntitled || 18);
      const takenDays = Math.round(leaveBalance?.annualLeaveTaken || 0);

      if (requestedDays > actualRemainingDays) {
        const message = `Insufficient leave days available. You have ${actualRemainingDays} days remaining from your ${entitledDays} annual entitlement (${takenDays} already taken). You cannot request ${requestedDays} days. Please request ${actualRemainingDays} days or fewer, or apply for Unpaid Leave/Personal Leave instead.`;
        toast.error(message);
        return false;
      }
    }

    return true;
  };

  const handleSaveAsDraft = async () => {
    if (!form.startDate || !form.endDate) {
      toast.error("Start and end dates are required to save");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createLeave.mutateAsync({
        title: `${form.leaveType} Leave Request`,
        leaveType: form.leaveType as any,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.contactDuringLeave,
        leaveDaysEntitled: parseInt(form.leaveDaysEntitled) || 0,
        leaveDaysTaken: parseInt(form.leaveDaysTaken) || 0,
        leaveDaysRequested: parseInt(form.leaveDaysRequested) || 0,
      });

      toast.success("Draft saved successfully");
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Check eligibility for annual leave
    if (form.leaveType === "annual" && leaveBalance && !leaveBalance.isEligibleForAnnualLeave) {
      toast.error(`Annual leave not available yet. You'll be eligible after ${Math.max(0, 12 - (leaveBalance.monthsEmployed || 0))} more month(s)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const businessDaysRequested = calculateBusinessDays(form.startDate, form.endDate);

      // Parse backup person details
      const [backupName, backupPhone] = form.contactDuringLeave.split('|');

      // For parental leave, send both leaveType="parental" and parentalLeaveType
      const submitPayload: any = {
        title: `${form.leaveType === "parental" ? form.parentalLeaveType : form.leaveType} Leave Request - ${form.documentId}`,
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || "",
        leaveDaysEntitled: parseInt(form.leaveDaysEntitled) || 18,
        leaveDaysTaken: parseInt(form.leaveDaysTaken) || 0,
        leaveDaysRequested: businessDaysRequested,
        backupPersonName: backupName?.trim() || "",
        backupPersonPhone: backupPhone?.trim() || "",
      };

      // Add parentalLeaveType if it's a parental leave request
      if (form.leaveType === "parental" && form.parentalLeaveType) {
        submitPayload.parentalLeaveType = form.parentalLeaveType;
      }

      const created = await createLeave.mutateAsync(submitPayload);

      const requestId = (created as any)?.id as number;

      console.log("[handleSubmit] Request created:", created);
      console.log("[handleSubmit] Extracted requestId:", requestId, "Type:", typeof requestId);

      // Store complete form data first (without File objects which can't be serialized)
      if (requestId && requestId > 0) {
        try {
          // STEP 1: Upload employee signature if it's a data URL (needs to be uploaded to server)
          let finalEmployeeSignatureUrl = form.employeeSignatureUrl;

          if (form.employeeSignatureUrl && form.employeeSignatureUrl.startsWith('data:')) {
            console.log("[handleSubmit] Uploading employee signature to server...");
            try {
              const uploadResult = await uploadEmployeeSignature.mutateAsync({
                requestId: requestId,
                fileData: form.employeeSignatureUrl,
                fileName: `employee-signature-${requestId}`,
                fileType: 'image/png',
              });
              finalEmployeeSignatureUrl = uploadResult.fileUrl;
              console.log("[handleSubmit] Employee signature uploaded:", finalEmployeeSignatureUrl);
            } catch (uploadError) {
              console.error("[handleSubmit] Failed to upload employee signature:", uploadError);
              toast.error("Warning: Failed to upload employee signature, but continuing with submission");
            }
          }

          // STEP 2: Store complete form data with the correct signature URL
          const formDataToStore = {
            ...form,
            employeeSignature: null, // Don't store File object
            employeeSignatureUrl: finalEmployeeSignatureUrl || "", // Store server URL or data URL
            managerSignature: null, // Don't store File object
            managerSignatureUrl: form.managerSignatureUrl || "", // Store URL instead
            supportingDocument: null, // Don't store File object
            supportingDocumentUrl: form.supportingDocumentUrl || "", // Store URL instead
            additionalDocuments: form.additionalDocuments.map(doc => doc.name), // Store file names instead of File objects
            approverSignatureUrl: approverSignatureUrl || "", // Include approver signature URL
          };

          console.log("[handleSubmit] Form object:", form);
          console.log("[handleSubmit] Storing form data for requestId:", requestId);
          console.log("[handleSubmit] employeeName being stored:", formDataToStore.employeeName);
          console.log("[handleSubmit] employeeSignatureUrl being stored:", formDataToStore.employeeSignatureUrl ? "PRESENT" : "EMPTY");
          console.log("[handleSubmit] supportingDocumentUrl being stored:", formDataToStore.supportingDocumentUrl ? "PRESENT" : "EMPTY");

          await storeFormData.mutateAsync({
            requestId: requestId,
            formData: formDataToStore,
          });
          console.log("[handleSubmit] Form data stored successfully");
          console.log("[handleSubmit] Mutation result:", storeFormData.data);
        } catch (e) {
          console.error("Failed to store form data:", e);
          toast.error("Critical Error: Failed to save form details. Submission has been cancelled. Please try again.");
          setIsSubmitting(false);
          return; // IMPORTANT: Stop the submission process
        }
      }

      // Submit request after form is stored
      submitRequest.mutate({
        id: requestId,
        initialApproverId: Number(form.reportingManager),
      });

      // Show success immediately - submission is async
      toast.success("Leave request submitted successfully to your Head of Department");
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white text-black px-10 leave-form-container relative">

      {/* CLOSE/BACK BUTTON */}
      {(isApprover || isReadOnly || !isApprover) && (
        <button
          onClick={() => onBack ? onBack() : (onClose ? onClose() : window.history.back())}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
          title="Close form"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* LOADING STATE FOR APPROVER */}
      {isApprover && getFormData.isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading employee's submitted form...</p>
          </div>
        </div>
      )}

      {/* SHOW FORM WHEN NOT LOADING */}
      {!(isApprover && getFormData.isLoading) && (
        <div>

          {/* ===== HEADER WITH LOGO AND CONTACT INFO ===== */}
          <div className="flex justify-between items-start px-8 py-6 gap-12">
            {/* LEFT: LOGO */}
            <div className="shrink-0">
              <img
                src="/logo/centrikaLogo.png"
                alt="Centrika Logo"
                className="h-32 w-auto"
              />
            </div>

            {/* RIGHT: CONTACT INFO WITH ICONS - STACKED VERTICALLY */}
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

          {/* ===== TITLE BAR (YELLOW) ===== */}
          <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide">
            {getLeaveTypeConfig(leaveType || form.leaveType).title}
          </div>

          {/* ===== REJECTION STATUS ALERT ===== */}
          {isRequestRejected && (
            <div className="bg-red-50 border-l-4 border-red-500 px-4 py-4 mb-6 rounded-r">
              <div className="flex items-start gap-3">
                <div className="text-red-600 mt-0.5">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">Request Rejected</h3>
                  <p className="text-sm text-red-700">This leave request has been rejected and is now read-only. Please contact your Head of Department if you have any questions.</p>
                </div>
              </div>
            </div>
          )}

          {/* ===== WARNING BANNERS FOR LEAVES REQUIRING DOCUMENTS ===== */}

          {/* ===== REQUEST HEADER SECTION ===== */}
          <div className="grid grid-cols-5 gap-3 px-6 py-3 text-sm items-end">
            {/* Department */}
            <div>
              <p className="font-semibold text-blue-600 mb-1 text-xs">Name of department</p>
              <div className="flex gap-0 items-center">
                <span className="text-blue-600 font-bold text-xs whitespace-nowrap">CTK - </span>
                <Input
                  value={form.department}
                  className="w-full h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed border-l-0"
                  disabled
                />
              </div>
            </div>

            {/* Nature of Leave */}
            <div>
              <p className="font-semibold text-blue-600 mb-1 text-xs">Nature of Leave</p>
              <Input
                value={form.leaveType.charAt(0).toUpperCase() + form.leaveType.slice(1)}
                onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                className="h-7 border-blue-400 text-xs"
                placeholder="Annual"
                disabled
              />
            </div>

            {/* Year */}
            <div>
              <p className="font-semibold text-blue-600 text-xs mb-1">Year</p>
              <Input
                type="number"
                value={form.year}
                className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>

            {/* Month */}
            <div>
              <p className="font-semibold text-blue-600 text-xs mb-1">Month</p>
              <Input
                type="text"
                value={form.month ? ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][parseInt(form.month)] || '' : ''}
                className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>

            {/* Document ID */}
            <div>
              <p className="font-semibold text-blue-600 text-xs mb-1">Document ID</p>
              <Input
                value={form.documentId}
                className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
                placeholder="Auto-generated"
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
                  value={form.requestNumber}
                  onChange={(e) => setForm({ ...form, requestNumber: e.target.value })}
                  className="border-blue-300 h-7 text-xs"
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

              <Row label="1.4 Staff ID">
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

            {/* 2.5 BACKUP CONTACT PERSON - Comes before 2. LEAVE DETAILS */}
            <Section title="2.5 Backup Person Contact Details">
              <Row label="Backup Person Name">
                <Input
                  value={form.contactDuringLeave ? form.contactDuringLeave.split('|')[0] : ''}
                  onChange={(e) => {
                    const tel = form.contactDuringLeave ? form.contactDuringLeave.split('|')[1] : '';
                    !effectiveIsReadOnly && setForm({ ...form, contactDuringLeave: `${e.target.value}|${tel}` });
                  }}
                  disabled={effectiveIsReadOnly}
                  placeholder="Name of person covering for you during leave"
                  className="border-blue-300 h-7 text-xs"
                />
              </Row>
              <Row label="Backup Person Tel">
                <Input
                  value={form.contactDuringLeave ? form.contactDuringLeave.split('|')[1] : ''}
                  onChange={(e) => {
                    const name = form.contactDuringLeave ? form.contactDuringLeave.split('|')[0] : '';
                    !effectiveIsReadOnly && setForm({ ...form, contactDuringLeave: `${name}|${e.target.value}` });
                  }}
                  disabled={effectiveIsReadOnly}
                  placeholder="Backup person's telephone number"
                  className="border-blue-300 h-7 text-xs"
                />
              </Row>
            </Section>

            {/* 2. LEAVE DETAILS */}
            <Section title="2. LEAVE DETAILS">
              <Row label="2.1 Nature of Leave">
                <Input
                  value={form.leaveType.charAt(0).toUpperCase() + form.leaveType.slice(1) + " Leave"}
                  disabled
                  className="border-blue-300 bg-gray-100 cursor-not-allowed !text-black font-bold pointer-events-none"
                />
              </Row>

              {/* Unpaid Leave Info - Professional message - positioned right after Nature of Leave */}
              {!isApprover && form.leaveType === "unpaid" && (
                <div className="px-4 py-3 mb-4 bg-gray-50 border-l-4 border-gray-500 rounded">
                  <p className="text-sm font-semibold text-gray-900 mb-2">ℹ️ Unpaid Leave Information</p>
                  <p className="text-sm text-gray-800">
                    Unpaid leave is available at the discretion of your department head. The number of days is not limited by company policy, but must be approved by management. Please provide a reason for your request.
                  </p>
                </div>
              )}

              {/* Unpaid Leave Balance Summary - Positioned right after Unpaid Leave Information */}
              {!isApprover && form.leaveType === "unpaid" && (
                <div className="px-3 py-3 mb-4 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-xs text-gray-600 font-semibold mb-2">LEAVE BALANCE SUMMARY</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Total Entitled</p>
                      <p className="text-lg font-bold">Unlimited</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Already Taken</p>
                      <p className="text-lg font-bold text-orange-600">{form.leaveDaysTaken || 0} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Remaining</p>
                      <p className="text-lg font-bold text-green-600">N/A</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2.1a Parental Leave Type Selector - Only for parental leaves */}
              {(form.leaveType === "parental") && (
                <>
                  <Row label="2.1a Parental Leave Type">
                    <Select value={form.parentalLeaveType || ""} onValueChange={(value) => {
                      setForm({
                        ...form,
                        parentalLeaveType: value as "paternity" | "maternity" | "",
                      });
                    }} disabled={effectiveIsReadOnly}>
                      <SelectTrigger className="w-full h-10 border-blue-300 bg-white text-black font-medium focus:ring-blue-500">
                        <SelectValue placeholder="-- Select Parental Leave Type --" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-blue-200">
                        <SelectItem value="paternity" className="focus:bg-blue-500 focus:text-white">Paternity Leave (7 days)</SelectItem>
                        <SelectItem value="maternity" className="focus:bg-blue-500 focus:text-white">Maternity Leave (12 weeks / 84 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>

                  {/* Parental Leave Info - Professional message - positioned right after type selector */}
                  {!isApprover && form.leaveType === "parental" && (
                    <div className="px-4 py-3 mb-4 bg-green-50 border-l-4 border-green-500 rounded">
                      <p className="text-sm font-semibold text-green-900 mb-2">ℹ️ Parental Leave Information</p>
                      {form.parentalLeaveType === "paternity" && (
                        <p className="text-sm text-green-800">
                          You are entitled to <span className="font-bold">7 days</span> of paternity leave upon the birth of a child.
                        </p>
                      )}
                      {form.parentalLeaveType === "maternity" && (
                        <p className="text-sm text-green-800">
                          You are entitled to <span className="font-bold">12 weeks (84 days)</span> of maternity leave.
                        </p>
                      )}
                      {!form.parentalLeaveType && (
                        <p className="text-sm text-green-800">
                          Select your parental leave type above to view specific entitlement details.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Parental Leave Balance Summary - Displayed after type is selected */}
                  {!isApprover && form.leaveType === "parental" && form.parentalLeaveType && (
                    <div className="px-3 py-3 mb-4 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-xs text-gray-600 font-semibold mb-2">LEAVE BALANCE SUMMARY</p>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-600">Total Entitled</p>
                          <p className="text-lg font-bold">{form.parentalLeaveType === "paternity" ? "7 days" : form.parentalLeaveType === "maternity" ? "84 days" : "0 days"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Already Taken</p>
                          <p className="text-lg font-bold text-orange-600">{form.leaveDaysTaken || 0} days</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Remaining</p>
                          <p className="text-lg font-bold text-green-600">{Math.max(0, (form.parentalLeaveType === "paternity" ? 7 : form.parentalLeaveType === "maternity" ? 84 : 0) - (form.leaveDaysTaken || 0))} days</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Sick Leave Info - Professional message - positioned after 2.1 */}
              {!isApprover && form.leaveType === "sick" && !effectiveIsReadOnly && (
                <div className="px-4 py-3 mb-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Sick Leave</p>
                  <p className="text-sm text-blue-800">
                    <span className="font-bold">Maximum 5 days</span> per request. Medical certificate required. For requests over 5 days, add a note explaining why.
                  </p>
                </div>
              )}

              {/* Sick Leave Balance Summary - Positioned right after Sick Leave Information */}
              {!isApprover && form.leaveType === "sick" && !effectiveIsReadOnly && (
                <div className="px-3 py-3 mb-4 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-xs text-gray-600 font-semibold mb-2">LEAVE BALANCE SUMMARY</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Standard Request</p>
                      <p className="text-lg font-bold text-blue-600">Up to 5 days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Already Taken</p>
                      <p className="text-lg font-bold text-orange-600">{form.leaveDaysTaken || 0} days</p>

                      {/* Show approved leave requests details */}
                      {userRequests.data && userRequests.data.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-orange-200">
                          <p className="text-xs font-semibold text-orange-700 mb-1">Approved Requests:</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {userRequests.data
                              .filter(req => req.status === "approved" && req.type === "leave")
                              .map((req) => {
                                // Find leave details
                                const leaveDetail = req.typeDetails as any;

                                // Parse dates - they come as YYYY-MM-DD strings
                                let startDate = 'N/A';
                                let endDate = 'N/A';
                                let days = 0;

                                if (leaveDetail?.startDate && leaveDetail?.endDate) {
                                  try {
                                    const start = new Date(leaveDetail.startDate + 'T00:00:00');
                                    const end = new Date(leaveDetail.endDate + 'T00:00:00');
                                    startDate = start.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                                    endDate = end.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                                  } catch (e) {
                                    // Keep N/A if date parsing fails
                                  }
                                }

                                if (leaveDetail?.leaveDaysRequested) {
                                  days = Math.round(leaveDetail.leaveDaysRequested);
                                }

                                return (
                                  <div key={req.id} className="text-xs text-orange-700 bg-white p-1 rounded">
                                    <p className="font-medium">{startDate} - {endDate} ({days}d)</p>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Over 5 days</p>
                      <p className="text-lg font-bold text-orange-600">+ Note</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2.2 LEAVE BALANCE ELIGIBILITY STATUS - CALCULATED FROM FORM EMPLOYMENT DATE */}
              {!isApprover && form.leaveType === "annual" && form.dateOfEmployment && (
                <div className={`px-4 py-3 mb-4 border-l-4 rounded ${localLeaveBalance.isEligible
                    ? 'bg-green-50 border-green-500'
                    : 'bg-orange-50 border-orange-500'
                  }`}>
                  <p className="text-sm font-semibold mb-2">
                    {localLeaveBalance.isEligible
                      ? '✓ Now Eligible for Annual Leave'
                      : '⚠️ Not Eligible for Annual Leave Yet'}
                  </p>

                  {localLeaveBalance.isEligible ? (
                    /* Eligible: Show detailed breakdown */
                    <div className="text-sm">
                      <p className="text-gray-700 mb-2">
                        Employment tenure: <span className="font-semibold">{localLeaveBalance.yearsEmployed} year(s) and {localLeaveBalance.monthsEmployed % 12} month(s)</span>
                      </p>
                      <div className="grid grid-cols-2 gap-3 bg-white bg-opacity-60 p-2 rounded">
                        <div>
                          <p className="text-xs text-gray-600">Base Entitlement</p>
                          <p className="text-lg font-bold text-blue-600">{localLeaveBalance.baseEntitlement}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Accrued This Year</p>
                          <p className="text-lg font-bold text-purple-600">+{Math.round(localLeaveBalance.accruedSinceFirstYear || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Taken</p>
                          <p className="text-lg font-bold text-orange-600">{Math.round(leaveBalance?.annualLeaveTaken || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Remaining</p>
                          <p className="text-lg font-bold text-green-600">{Math.round(Math.max(0, (localLeaveBalance.totalAnnualLeave - (leaveBalance?.annualLeaveTaken || 0))))}</p>
                        </div>
                      </div>
                      {calculatedBusinessDays > Math.max(0, (localLeaveBalance.totalAnnualLeave - (leaveBalance?.annualLeaveTaken || 0))) && (
                        <p className="text-xs text-red-600 mt-2 font-semibold">
                          ⚠️ Request ({calculatedBusinessDays} days) exceeds remaining ({Math.round(Math.max(0, (localLeaveBalance.totalAnnualLeave - (leaveBalance?.annualLeaveTaken || 0))))} days)
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Not Eligible: Show accrual but block submission */
                    <div className="text-sm">
                      <p className="text-gray-700 mb-2">
                        Employment tenure: <span className="font-semibold">{localLeaveBalance.monthsEmployed} month(s)</span>
                      </p>
                      <div className="bg-white bg-opacity-60 p-2 rounded mb-2">
                        <p className="text-gray-700">
                          You have accrued <span className="font-bold text-blue-600">{Math.round(localLeaveBalance.totalAnnualLeave || 0)} days</span> of annual leave based on your employment period.
                        </p>
                        <p className="text-gray-700 mt-1">
                          You'll be eligible to use annual leave after <span className="font-bold">{Math.max(0, 12 - localLeaveBalance.monthsEmployed)} more month(s)</span> of employment.
                        </p>
                      </div>
                      <p className="text-xs text-orange-700 font-semibold">
                        Annual leave requests can only be submitted after completing 1 year with the company.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Annual Leave Summary (only for Annual Leave) - Positioned after eligibility status */}
              {!isApprover && form.leaveType === "annual" && form.dateOfEmployment && (
                <div className="px-3 py-3 mb-4 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-xs text-gray-600 font-semibold mb-2">LEAVE BALANCE SUMMARY</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Total Entitled</p>
                      <p className="text-lg font-bold">{Math.round(localLeaveBalance.totalAnnualLeave || 0)} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Already Taken</p>
                      <p className="text-lg font-bold text-orange-600">{Math.round(leaveBalance?.annualLeaveTaken || 0)} days</p>

                      {/* Show approved leave requests details */}
                      {userRequests.data && userRequests.data.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-orange-200">
                          <p className="text-xs font-semibold text-orange-700 mb-1">Approved Requests:</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {userRequests.data
                              .filter(req => req.status === "approved" && req.type === "leave")
                              .map((req) => {
                                // Find leave details
                                const leaveDetail = req.typeDetails as any;

                                // Parse dates - they come as YYYY-MM-DD strings
                                let startDate = 'N/A';
                                let endDate = 'N/A';
                                let days = 0;

                                if (leaveDetail?.startDate && leaveDetail?.endDate) {
                                  try {
                                    const start = new Date(leaveDetail.startDate + 'T00:00:00');
                                    const end = new Date(leaveDetail.endDate + 'T00:00:00');
                                    startDate = start.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                                    endDate = end.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                                  } catch (e) {
                                    // Keep N/A if date parsing fails
                                  }
                                }

                                if (leaveDetail?.leaveDaysRequested) {
                                  days = Math.round(leaveDetail.leaveDaysRequested);
                                }

                                return (
                                  <div key={req.id} className="text-xs text-orange-700 bg-white p-1 rounded">
                                    <p className="font-medium">{startDate} - {endDate} ({days}d)</p>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Remaining</p>
                      <p className="text-lg font-bold text-green-600">{Math.round(Math.max(0, localLeaveBalance.totalAnnualLeave - (leaveBalance?.annualLeaveTaken || 0)))} days</p>
                    </div>
                  </div>
                </div>
              )}

              <Row label="2.5 Will you be outside the country?">
                <div className="flex gap-8 py-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="outside-country"
                      value="yes"
                      checked={form.outsideCountry === "yes"}
                      onChange={() => !effectiveIsReadOnly && setForm({ ...form, outsideCountry: "yes" })}
                      disabled={effectiveIsReadOnly}
                      className="w-4 h-4"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="outside-country"
                      value="no"
                      checked={form.outsideCountry === "no"}
                      onChange={() => !effectiveIsReadOnly && setForm({ ...form, outsideCountry: "no" })}
                      disabled={effectiveIsReadOnly}
                      className="w-4 h-4"
                    />
                    No
                  </label>
                </div>
              </Row>
            </Section>

            {/* 3. LEAVE BALANCE */}
            <Section title="3. LEAVE BALANCE">
              <Row label="3.1 Start Date & End Date" doubleRow={true}>
                <div className="space-y-3">
                  <DateRangePicker
                    startDate={form.startDate}
                    endDate={form.endDate}
                    maxDays={form.leaveType === "parental"
                      ? (form.parentalLeaveType === "paternity" ? 7 : form.parentalLeaveType === "maternity" ? 84 : 0)
                      : 18}
                    onStartDateChange={(date) => {
                      if (!effectiveIsReadOnly) {
                        const businessDays = calculateBusinessDays(date, form.endDate);
                        const maxDays = form.leaveType === "parental"
                          ? (form.parentalLeaveType === "paternity" ? 7 : form.parentalLeaveType === "maternity" ? 84 : 0)
                          : 18;
                        if (businessDays <= maxDays) {
                          setForm({ ...form, startDate: date });
                        } else {
                          toast.error(`Selected dates exceed ${maxDays}-day limit`);
                        }
                      }
                    }}
                    onEndDateChange={(date) => {
                      if (!effectiveIsReadOnly) {
                        const businessDays = calculateBusinessDays(form.startDate, date);
                        const maxDays = form.leaveType === "parental"
                          ? (form.parentalLeaveType === "paternity" ? 7 : form.parentalLeaveType === "maternity" ? 84 : 0)
                          : 18;
                        if (businessDays <= maxDays) {
                          setForm({ ...form, endDate: date });
                        } else {
                          toast.error(`Selected dates exceed ${maxDays}-day limit`);
                        }
                      }
                    }}
                    disabled={effectiveIsReadOnly}
                  />
                  {calculatedBusinessDays > 0 && !effectiveIsReadOnly && (
                    <div className="p-3 bg-green-50 border border-green-300 rounded text-sm text-green-800">
                      <p className="font-semibold mb-1">📋 Leave Duration Summary:</p>
                      <div className="space-y-1">
                        <p><span className="font-medium">Business Days:</span> {calculatedBusinessDays} days (weekends excluded)</p>
                        <p className="text-xs text-green-700 italic">Note: Holidays are not included in this calculation and will be managed by HR.</p>
                        <p className="text-xs text-gray-600">Max allowed: {form.leaveType === "parental" ? (form.parentalLeaveType === "paternity" ? "7 days" : form.parentalLeaveType === "maternity" ? "84 days" : "0 days") : "18 days"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Row>


              <Row label={`3.2 ${form.leaveType === "annual" ? "Annual" : form.leaveType === "sick" ? "Sick" : form.leaveType === "parental" ? "Parental" : form.leaveType === "personal" ? "Personal" : form.leaveType === "unpaid" ? "Unpaid" : "Leave"} Leave Days Entitled`}>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={form.leaveType === "annual" && form.dateOfEmployment ? localLeaveBalance.totalAnnualLeave : form.leaveType === "sick" ? 5 : form.leaveType === "parental" ? (form.parentalLeaveType === "paternity" ? 7 : form.parentalLeaveType === "maternity" ? 84 : 0) : form.leaveDaysEntitled || 18}
                    disabled
                    className="border-blue-300 bg-blue-50 cursor-not-allowed font-medium"
                  />
                  <span className="text-sm font-medium text-gray-600">Days</span>
                </div>
              </Row>

              <Row label="3.3 Number of Leave Days already Taken">
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={Math.round(parseInt(form.leaveDaysTaken) || 0)}
                    disabled
                    className="border-blue-300 bg-gray-100 cursor-not-allowed font-medium"
                  />
                  <span className="text-sm font-medium text-gray-600">Days</span>
                </div>
              </Row>

              <Row label="3.4 Number of Leave Days under Request">
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={calculatedBusinessDays}
                    disabled
                    className="border-blue-300 bg-gray-100 cursor-not-allowed !text-black font-medium"
                  />
                  <span className="text-sm font-medium text-gray-600">Days</span>
                </div>
              </Row>

              <Row label="3.5 Remaining Leave Days">
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={form.leaveType === "annual" && form.dateOfEmployment ? Math.max(0, localLeaveBalance.totalAnnualLeave - (leaveBalance?.annualLeaveTaken || 0) - calculatedBusinessDays) : form.leaveType === "parental" ? Math.max(0, (form.parentalLeaveType === "paternity" ? 7 : form.parentalLeaveType === "maternity" ? 84 : 0) - (form.leaveDaysTaken || 0) - calculatedBusinessDays) : (form.leaveDaysRemaining || 0)}
                    disabled
                    className="border-blue-300 bg-blue-50 font-medium"
                  />
                  <span className="text-sm font-medium text-gray-600">Days</span>
                </div>
              </Row>

            </Section>

            {/* 3. SUPPORTING DOCUMENTS AND EMPLOYEE SIGNATURE */}
            <Section title="3. SUPPORTING DOCUMENTS AND EMPLOYEE SIGNATURE">
              {/* Supporting Document Section - For Sick, Paternity, and Maternity Leaves */}
              {(form.leaveType === "sick" || form.leaveType === "paternity" || form.leaveType === "maternity") && !effectiveIsReadOnly && (
                <>
                  {/* Document Requirement Alert */}
                  {form.leaveType === "sick" && (
                    <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 mb-4 rounded">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">⚠️</span>
                        <div>
                          <p className="text-sm font-semibold text-red-700 mb-1">Medical Document Required</p>
                          <p className="text-sm text-red-800">A valid medical certificate or hospital papers must be submitted with this request.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {form.leaveType === "paternity" && (
                    <div className="bg-cyan-50 border-l-4 border-cyan-500 px-4 py-3 mb-4 rounded">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">⚠️</span>
                        <div>
                          <p className="text-sm font-semibold text-cyan-700 mb-1">Birth Certificate Required</p>
                          <p className="text-sm text-cyan-800">A birth certificate or proof of birth must be submitted with this request.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {form.leaveType === "maternity" && (
                    <div className="bg-pink-50 border-l-4 border-pink-500 px-4 py-3 mb-4 rounded">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">⚠️</span>
                        <div>
                          <p className="text-sm font-semibold text-pink-700 mb-1">Medical Document Required</p>
                          <p className="text-sm text-pink-800">A valid medical certificate or hospital papers must be submitted with this request.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Row label="3.4a Supporting Document">
                    <div className="space-y-3 w-full">
                      {!effectiveIsReadOnly && (
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const file = e.target.files[0];
                              setForm({ ...form, supportingDocument: file });
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                setForm(prev => ({ ...prev, supportingDocumentUrl: dataUrl }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="border-blue-300 h-7 text-xs border rounded px-2 py-1 w-full"
                          required
                        />
                      )}
                      {form.supportingDocumentUrl && (
                        <div className="p-3 border-2 border-dashed border-green-300 rounded bg-green-50">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-700 font-semibold">✓ Document Uploaded</span>
                            <span className="text-xs text-gray-600">
                              {form.supportingDocument?.name || "File attached"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Row>

                  {/* Conditional Reason Textarea - Show only if requesting > max days */}
                  {form.leaveType === "sick" && parseInt(form.leaveDaysRequested) > 5 && (
                    <Row label="3.4b Additional Reason (Required for > 5 days)">
                      <div className="space-y-2 w-full">
                        <p className="text-sm text-gray-600">
                          Please provide details explaining why you need more than 5 days of sick leave.
                        </p>
                        {!effectiveIsReadOnly ? (
                          <textarea
                            value={form.leaveReason}
                            onChange={(e) => setForm({ ...form, leaveReason: e.target.value })}
                            placeholder="Enter your reason here..."
                            className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                            required
                          />
                        ) : (
                          <div className="p-3 border border-gray-300 rounded bg-gray-50 text-gray-700 text-sm whitespace-pre-wrap">
                            {form.leaveReason || "No reason provided"}
                          </div>
                        )}
                      </div>
                    </Row>
                  )}
                </>
              )}

              <Row label="3.5 Employee Signature">
                {/* Show signature upload only if form is editable (not submitted/approved) */}
                {!effectiveIsReadOnly ? (
                  <div className="space-y-3">
                    <div>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0];
                            setForm({ ...form, employeeSignature: file });
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const dataUrl = event.target?.result as string;
                              setForm(prev => ({ ...prev, employeeSignatureUrl: dataUrl }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="border-blue-300 h-7 text-xs border rounded px-2 py-1 w-full"
                      />
                    </div>
                    {form.employeeSignatureUrl && (
                      <div className="p-3 border-2 border-dashed border-blue-300 rounded bg-blue-50">
                        <img src={form.employeeSignatureUrl} alt="signature" className="h-14 object-contain" />
                      </div>
                    )}
                    <SingleDatePicker
                      value={form.signatureDate}
                      onChange={(date) => setForm({ ...form, signatureDate: date })}
                      disabled={false}
                      label="Signature Date"
                    />
                  </div>
                ) : (
                  // View mode - show signature and date (read-only after submission/approval)
                  <div className="space-y-3">
                    {form.employeeSignatureUrl && (
                      <div className="p-3 border-2 border-dashed border-blue-300 rounded bg-blue-50">
                        <img src={form.employeeSignatureUrl} alt="signature" className="h-14 object-contain" />
                      </div>
                    )}
                    {!form.employeeSignatureUrl && (
                      <div className="p-3 border-2 border-dashed border-gray-300 rounded bg-gray-50">
                        <p className="text-xs text-gray-600">No signature provided</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-1">Signature Date</p>
                      <p className="text-xs text-gray-700">{form.signatureDate || "Not provided"}</p>
                    </div>
                  </div>
                )}
              </Row>
            </Section>



            {/* 4. APPROVAL WORKFLOW */}
            <Section title="4. APPROVAL WORKFLOW">
              {isApprover ? (
                // APPROVER MODE - Show approval sections for current user role
                <>
                  {user?.role === "head_of_department" && (
                    <ApproverApprovalSection
                      title={`${getHODName(form.reportingManager)} - DEPARTMENT HEAD APPROVAL`}
                      approverRole="Head of Department"
                      approvalComments={approvalComments}
                      onCommentsChange={setApprovalComments}
                      approverSignature={approverSignature}
                      onSignatureChange={setApproverSignature}
                      isHODLevel={true}
                      isReadOnly={approvalSectionIsReadOnly}
                      approverSignatureUrl={form.managerSignatureUrl}
                      requestId={requestData?.id}
                      onSignatureFileIdChange={setApproverSignatureFileId}
                    />
                  )}

                  {/* 
              // COMMENTED OUT: HR APPROVAL - Not needed for leave requests
              // {user?.role === "hr" && (
              //   <ApproverApprovalSection 
              //     title="HUMAN RESOURCES APPROVAL"
              //     approverRole="HR Manager"
              //     approvalComments={approvalComments}
              //     onCommentsChange={setApprovalComments}
              //     approverSignature={approverSignature}
              //     onSignatureChange={setApproverSignature}
              //     isReadOnly={approvalSectionIsReadOnly}
              //     isHODLevel={false}
              //     requestId={requestData?.id}
              //   />
              // )}
              */}

                  {/* 
              // COMMENTED OUT: FINANCE APPROVAL - Not needed for leave requests
              // {user?.role === "head_of_finance" && (
              //   <ApproverApprovalSection 
              //     title="FINANCE APPROVAL"
              //     approverRole="Finance Manager"
              //     approvalComments={approvalComments}
              //     onCommentsChange={setApprovalComments}
              //     approverSignature={approverSignature}
              //     onSignatureChange={setApproverSignature}
              //     isHODLevel={false}
              //     isReadOnly={approvalSectionIsReadOnly}
              //     requestId={requestData?.id}
              //   />
              // )}
              */}

                  {/* 
              // COMMENTED OUT: CEO/MD APPROVAL - Not needed for leave requests
              // {user?.role === "ceo_md" && (
              //   <ApproverApprovalSection 
              //     title="CEO/MANAGING DIRECTOR APPROVAL"
              //     approverRole="CEO/MD"
              //     approvalComments={approvalComments}
              //     onCommentsChange={setApprovalComments}
              //     approverSignature={approverSignature}
              //     onSignatureChange={setApproverSignature}
              //     isHODLevel={false}
              //     isReadOnly={approvalSectionIsReadOnly}
              //     requestId={requestData?.id}
              //   />
              // )}
              */}
                </>
              ) : (
                // EMPLOYEE MODE - Show the HOD, HR, CEO approval sections as info
                <>
                  {/* Show HOD Approval Data if request is approved */}
                  {isRequestApproved && (
                    <ApproverApprovalSection
                      title={`${getHODName(form.reportingManager)} - DEPARTMENT HEAD APPROVAL`}
                      approverRole="Head of Department"
                      approvalComments={approvalComments}
                      onCommentsChange={() => { }}
                      approverSignature={null}
                      onSignatureChange={() => { }}
                      isHODLevel={true}
                      isReadOnly={true}
                      approverSignatureUrl={form.managerSignatureUrl}
                      requestId={requestData?.id}
                    />
                  )}

                  {/* If not approved yet, show manager selector */}
                  {!isRequestApproved && (
                    <ApprovalSection
                      number="4.1"
                      title="LINE MANAGER'S / HOD's APPROVAL"
                      managerId={form.reportingManager}
                      onManagerChange={(v) => setForm({ ...form, reportingManager: v })}
                      heads={uniqueHeads}
                      isManagerSection={true}
                      approverSignatureUrl={approverSignatureUrl}
                    />
                  )}
                  {/* Only show HR and CEO approval sections for new draft forms, not for submitted requests */}
                  {!requestData && (
                    <>
                      <ApprovalSection number="4.2" title="ADMINISTRATION / HR'S APPROVAL" />
                      <ApprovalSection number="4.3" title="CEO'S APPROVAL" />
                    </>
                  )}
                </>
              )}
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
              {isApprover && !approvalSectionIsReadOnly ? (
                <>
                  <Button
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => setShowRejectDialog(true)}
                    className="border-red-400 text-red-600 hover:bg-red-50"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reject
                  </Button>
                  <Button
                    disabled={isLoading}
                    onClick={() => {
                      if (onApprove) {
                        onApprove({
                          comments: approvalComments,
                          signatureFile: approverSignature,
                          signatureFileId: approverSignatureFileId,
                          selectedHR: user?.role === "head_of_department" ? parseInt(selectedHR) : null,
                        });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Approve {approverSignature || approverSignatureFileId ? "& Sign" : ""}
                  </Button>
                </>
              ) : !isReadOnly && !isRequestApproved && !isRequestRejected ? (
                <>
                  <Button variant="outline" disabled={isSubmitting} onClick={handleSaveAsDraft} className="border-blue-400">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Draft
                  </Button>
                  <Button disabled={isSubmitting} onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {/* ===== REJECT DIALOG ===== */}
          {isApprover && (
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Request</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting this leave request.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Enter rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={!rejectReason || isLoading}
                    onClick={() => {
                      if (onReject) {
                        onReject(rejectReason);
                      }
                    }}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reject
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* ===== FOOTER ===== */}
          <div className="text-center text-xs text-gray-600 py-3 border-t border-gray-200 space-y-1">
            <p>www.centrika.rw</p>
            <p>1 | Centrika Ltd | Motto: Delivering Tomorrow's Solutions Today</p>
          </div>
        </div>
      )}
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

function Row({
  label,
  doubleRow,
  children,
}: {
  label: string;
  doubleRow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid grid-cols-[220px_1fr] border-b border-blue-400 ${doubleRow ? '' : ''}`}>
      <div className="px-3 py-2 font-medium border-r border-blue-400 bg-blue-100 text-blue-700 text-xs">
        {label}
      </div>
      <div className="px-3 py-1">{children}</div>
    </div>
  );
}

function ApproverApprovalSection({
  title,
  approverRole,
  approvalComments,
  onCommentsChange,
  approverSignature,
  onSignatureChange,
  selectedHR,
  onHRChange,
  hrUsers = [],
  isHODLevel = false,
  isReadOnly = false,
  approverSignatureUrl = "",
  requestId,
  onSignatureFileIdChange,
}: {
  title: string;
  approverRole: string;
  approvalComments: string;
  onCommentsChange: (value: string) => void;
  approverSignature: File | null;
  onSignatureChange: (file: File | null) => void;
  selectedHR?: string;
  onHRChange?: (value: string) => void;
  hrUsers?: any[];
  isHODLevel?: boolean;
  isReadOnly?: boolean;
  approverSignatureUrl?: string;
  requestId?: number;
  onSignatureFileIdChange?: (fileId: number) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const [signatureFileId, setSignatureFileId] = useState<number | undefined>();
  const uploadAttachment = trpc.requests.uploadAttachment.useMutation();

  // Update signature URL when the prop changes (e.g., when loading form data)
  useEffect(() => {
    if (approverSignatureUrl && approverSignatureUrl.trim() !== "") {
      console.log("[ApproverApprovalSection] Setting signature URL from prop:", approverSignatureUrl);
      setSignatureUrl(approverSignatureUrl);
    }
  }, [approverSignatureUrl]);

  // Determine attachment type based on approver role
  const getAttachmentType = (): "employee_signature" | "manager_signature" | "hr_signature" | "ceo_signature" => {
    if (approverRole.includes("Head of Department") || approverRole.includes("Manager")) {
      return "manager_signature";
    } else if (approverRole.includes("HR") || approverRole.includes("Human Resources")) {
      return "hr_signature";
    } else if (approverRole.includes("CEO") || approverRole.includes("MD")) {
      return "ceo_signature";
    }
    return "employee_signature";
  };

  const handleSignatureChange = async (file: File | null) => {
    if (!file) {
      setSignatureUrl("");
      setSignatureFileId(undefined);
      onSignatureChange(null);
      if (onSignatureFileIdChange) {
        onSignatureFileIdChange(0);
      }
      return;
    }

    // Immediately display the signature as a data URL
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;

      // Show the signature image right away
      setSignatureUrl(dataUrl);
      onSignatureChange(file);
      toast.success("Signature attached successfully");

      // Try uploading to Spaces in the background (non-blocking)
      try {
        const base64Data = dataUrl.split(",")[1];
        const result = await uploadAttachment.mutateAsync({
          requestId: requestId || 0,
          fileName: file.name,
          fileData: base64Data,
          mimeType: file.type,
          attachmentType: getAttachmentType(),
        });

        // Update with server URL and file ID if upload succeeded
        setSignatureUrl(result.fileUrl);
        setSignatureFileId(result.fileId);
        if (onSignatureFileIdChange) {
          onSignatureFileIdChange(result.fileId);
        }
      } catch (uploadError) {
        // Upload failed but signature is still visible via data URL — that's fine
        console.log("[handleSignatureChange] Spaces upload skipped/failed, using data URL for display");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border-t border-blue-400">
      <div className="bg-blue-500 text-white font-bold px-4 py-2 text-sm">{title}</div>

      {/* Comments & Signature */}
      <Row label="Comments & Signature">
        <div className="space-y-4">
          {/* Comments Field */}
          <div>
            <label className="text-xs font-semibold text-blue-700 block mb-2">Comments (Optional)</label>
            <Textarea
              placeholder="Add your comments or observations..."
              value={approvalComments}
              onChange={(e) => onCommentsChange(e.target.value)}
              disabled={isReadOnly}
              className="border-blue-300 min-h-20"
            />
          </div>

          {/* Signature Upload/Display */}
          {!isReadOnly ? (
            // Editable mode - show file upload or uploaded signature
            <div className="border-t border-blue-200 pt-4">
              <label className="text-xs font-semibold text-blue-700 block mb-2">Your Signature</label>
              {!signatureUrl ? (
                <>
                  <p className="text-xs text-gray-600 mb-2">Upload an image or PDF of your signature</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleSignatureChange(file);
                      }
                    }}
                    disabled={isReadOnly || isUploading}
                    className="block w-full text-xs text-gray-600 border border-dashed border-blue-300 rounded p-2 cursor-pointer"
                  />
                  {isUploading && <p className="text-xs text-blue-600 mt-2">Uploading signature...</p>}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 border-2 border-dashed border-green-300 rounded bg-green-50">
                    <p className="text-xs font-semibold text-green-700 mb-2">Signature Uploaded:</p>
                    <img src={signatureUrl} alt="approver-signature" className="h-14 object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureUrl("");
                      onSignatureChange(null);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 text-left"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Read-only mode - show signature if available
            <div className="border-t border-blue-200 pt-4">
              {signatureUrl ? (
                <>
                  <label className="text-xs font-semibold text-blue-700 block mb-2">Signature</label>
                  <div className="p-3 border-2 border-dashed border-blue-300 rounded bg-blue-50">
                    <img src={signatureUrl} alt="approver-signature" className="h-14 object-contain" />
                  </div>
                </>
              ) : (
                <>
                  <label className="text-xs font-semibold text-blue-700 block mb-2">Signature</label>
                  <div className="p-3 border-2 border-dashed border-gray-300 rounded bg-gray-50">
                    <p className="text-xs text-gray-600">No signature provided</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Row>
    </div>
  );
} function ApprovalSection({
  number,
  title,
  managerId,
  onManagerChange,
  heads,
  isManagerSection = false,
  approverSignatureUrl = ""
}: {
  number: string;
  title: string;
  managerId?: string;
  onManagerChange?: (v: string) => void;
  heads?: any[];
  isManagerSection?: boolean;
  approverSignatureUrl?: string;
}) {
  // Default HR and CEO info (you can update these with actual data from backend)
  const approverInfo: Record<string, { name: string; role: string; description: string }> = {
    "4.2": {
      name: "HR Department",
      role: "Human Resources",
      description: "Will review your leave request for policy compliance and attendance records"
    },
    "4.3": {
      name: "Chief Executive Officer",
      role: "CEO/MD",
      description: "Final approval for your leave request"
    }
  };

  const currentApprover = approverInfo[number];

  return (
    <div className="border-t border-blue-400">
      <div className="bg-blue-500 text-white font-bold px-4 py-2 text-sm">{number} {title.toUpperCase()}</div>

      {/* Manager selection - only for line manager approval in employee form */}
      {isManagerSection && (
        <>
          <Row label={`${number}.1 Approver`}>
            <Input
              value={heads?.find(h => String(h.id) === managerId)?.name || ""}
              className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed"
              disabled
            />
          </Row>

          {/* HOD Signature Preview - only show if signature exists */}
          {approverSignatureUrl && (
            <Row label={`${number}.2 Signature`}>
              <div className="p-3 border-2 border-dashed border-green-300 rounded bg-green-50">
                {approverSignatureUrl.startsWith('data:image') ? (
                  <img src={approverSignatureUrl} alt="hod-signature" className="h-14 object-contain" />
                ) : approverSignatureUrl.startsWith('data:application/pdf') ? (
                  <embed src={approverSignatureUrl} type="application/pdf" className="w-full h-14" />
                ) : (
                  <img src={approverSignatureUrl} alt="hod-signature" className="h-14 object-contain" />
                )}
              </div>
            </Row>
          )}
        </>
      )}

      {/* HR and CEO Information Section */}
      {!isManagerSection && currentApprover && (
        <>
          <Row label={`${number}.1 Approver`}>
            <div className="space-y-2">
              <div className="bg-blue-50 rounded p-3 border border-blue-200">
                <p className="font-semibold text-blue-700 text-sm">{currentApprover.name}</p>
                <p className="text-xs text-blue-600 mb-2">{currentApprover.role}</p>
                <p className="text-xs text-gray-600 italic">{currentApprover.description}</p>
              </div>
              <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                <p className="font-semibold text-yellow-700 mb-1">📬 Approval Status</p>
                <p>Your request will be forwarded here after the previous stage approves it. You will receive a notification once they take action.</p>
              </div>
            </div>
          </Row>
        </>
      )}
    </div>
  );
}
