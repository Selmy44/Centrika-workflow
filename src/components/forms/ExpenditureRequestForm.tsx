"use client";

import { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/**
 * ExpenditureRequestForm - Matches LeaveRequestForm design system
 * Logo header, yellow title bar, Section/Row layout, actions bar, footer
 */

interface Props {
  onSuccess?: () => void;
  onClose?: () => void;
  onBack?: () => void;
}

export default function ExpenditureRequestForm({ onSuccess, onClose, onBack }: Props) {
  const { user, isAuthenticated } = useAuth();
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    requestNumber: "",
    employeeName: "",
    staffId: "",
    department: "",
    position: "",
    dateOfEmployment: "",
    expenseType: "",
    amount: "",
    currency: "RWF",
    purpose: "",
    reportingManager: "",
    employeeSignatureUrl: "",
    signaturePreview: "",
    signatureFile: null as File | null,
  });

  useEffect(() => {
    if (user && autoFillData) {
      const sequence = String(Math.floor(Math.random() * 10000)).padStart(5, '0');
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      const docId = `ER-${new Date().getFullYear()}-${currentMonth}-${sequence}`;

      setForm(prev => ({
        ...prev,
        requestNumber: docId,
        employeeName: autoFillData.employeeName || user.name || "",
        staffId: autoFillData.staffId || "",
        department: autoFillData.department || "",
        position: autoFillData.position || "",
        dateOfEmployment: autoFillData.dateOfEmployment || "",
        reportingManager: autoFillData.managerId ? String(autoFillData.managerId) : "",
      }));
    }
  }, [user, autoFillData]);

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

  const createExpenditure = trpc.requests.createExpenditureRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();
  const storeFormData = trpc.requests.storeExpenditureFormData.useMutation();

  const handleSubmit = async (submit: boolean) => {
    if (submit) {
      if (!form.reportingManager) {
        toast.error("Please select a reporting manager");
        return;
      }
      if (!form.expenseType.trim()) {
        toast.error("Type of expenditure is required");
        return;
      }
      if (!form.amount || Number(form.amount) <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }
      if (!form.employeeSignatureUrl) {
        toast.error("Please upload your signature");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const created = await createExpenditure.mutateAsync({
        title: form.expenseType || "Expenditure Request",
        amount: Number(form.amount),
        currency: form.currency,
        department: form.department,
        category: form.expenseType,
      });

      if (submit) {
        await submitRequest.mutateAsync({
          id: created.id,
          initialApproverId: Number(form.reportingManager),
        });
        await storeFormData.mutateAsync({
          requestId: created.id,
          formData: {
            ...form,
            requestDetails: created,
            signatureFile: undefined, // Non-serializable
          }
        });
      }

      toast.success(submit ? "Expenditure request submitted" : "Draft saved");
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="w-full bg-white text-black px-4 leave-form-container relative">



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

        {/* ===== TITLE BAR (YELLOW) ===== */}
        <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide">
          EXPENDITURE REQUEST FORM
        </div>

        {/* ===== REQUEST HEADER SECTION ===== */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 text-sm items-end">
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-xs">Department</p>
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
            <p className="font-semibold text-blue-600 mb-1 text-xs">Date of Request</p>
            <Input
              type="text"
              value={new Date().toISOString().split('T')[0]}
              className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Request Number</p>
            <Input
              value={form.requestNumber}
              className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Employee Name</p>
            <Input
              value={form.employeeName}
              className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        {/* ===== REQUEST DETAILS ===== */}
        <div className="border-t border-[#3b6dae]">
          <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

          {/* 1. EMPLOYEE INFORMATION */}
          <Section title="1. EMPLOYEE INFORMATION">
            <Row label="1.1 Request Number">
              <Input
                value={form.requestNumber}
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
            <Row label="1.3 Employee / Staff ID">
              <Input
                value={form.staffId}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="1.4 Department">
              <Input
                value={form.department}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
            <Row label="1.5 Position / Title">
              <Input
                value={form.position}
                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                disabled
              />
            </Row>
          </Section>

          {/* 2. EXPENDITURE DETAILS */}
          <Section title="2. EXPENDITURE DETAILS">
            <Row label="2.1 Type of Expenditure">
              <Input
                value={form.expenseType}
                onChange={e => setForm({ ...form, expenseType: e.target.value })}
                placeholder="e.g., Office Supplies, Travel, Equipment"
                className="border-blue-300 h-7 text-xs"
              />
            </Row>
            <Row label="2.2 Amount">
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  className="border-blue-300 h-7 text-xs"
                />
                <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="w-28 h-7 border-blue-300 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-blue-200">
                    <SelectItem value="RWF" className="focus:bg-blue-500 focus:text-white">RWF</SelectItem>
                    <SelectItem value="USD" className="focus:bg-blue-500 focus:text-white">USD</SelectItem>
                    <SelectItem value="EUR" className="focus:bg-blue-500 focus:text-white">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Row>
            <Row label="2.3 Purpose / Justification">
              <Textarea
                value={form.purpose}
                onChange={e => setForm({ ...form, purpose: e.target.value })}
                placeholder="Describe the purpose and justification for this expenditure..."
                className="min-h-20 border-blue-300 text-xs"
              />
            </Row>
          </Section>

          {/* 3. EMPLOYEE SIGNATURE */}
          <Section title="3. EMPLOYEE SIGNATURE">
            <Row label="3.1 Your Signature">
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setForm({ 
                          ...form, 
                          signatureFile: file, 
                          signaturePreview: URL.createObjectURL(file),
                          employeeSignatureUrl: ev.target?.result as string 
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs"
                />
                {form.employeeSignatureUrl && <img src={form.employeeSignatureUrl} alt="sig" className="h-10 object-contain border border-blue-300 p-1" />}
              </div>
            </Row>
          </Section>

          {/* 4. APPROVAL WORKFLOW */}
          <Section title="4. APPROVAL WORKFLOW">
            <Row label="4.1 Line Manager / HOD">
              <Input
                value={uniqueHeads.find((h: any) => h.id === parseInt(form.reportingManager))?.name || "Not assigned"}
                className="w-full h-8 border-blue-300 bg-gray-100 text-black font-medium cursor-not-allowed mt-1 mb-1 max-w-[400px]"
                disabled
              />
            </Row>
            <Row label="4.2 Head of Finance">
              <p className="text-xs text-gray-500 font-medium">Pending Finance Approval</p>
            </Row>
            <Row label="4.3 Final Approval (CEO/MD)">
              <p className="text-xs text-gray-500 font-medium">Pending Final Approval</p>
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
        <div className="text-center text-xs text-gray-600 py-3 border-t border-gray-200 space-y-1">
          <p>www.centrika.rw</p>
          <p>1 | Centrika Ltd | Motto: Delivering Tomorrow's Solutions Today</p>
        </div>
      </div>
    </div>
  );
}

/* ========= Helper Components ========= */

function Section({ title, children, className = "" }: { title: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={`border-t border-blue-400 ${className}`}>
      <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children, colSpan = false }: { label: React.ReactNode, children: React.ReactNode, colSpan?: boolean }) {
  return (
    <div className={`grid ${colSpan ? 'grid-cols-1' : 'grid-cols-[220px_1fr]'} border-b border-blue-400`}>
      {!colSpan && (
        <div className="px-3 py-2 font-medium border-r border-blue-400 bg-blue-100 text-[#3b6dae] text-xs flex items-center">
          {label}
        </div>
      )}
      <div className="px-3 py-1 flex items-center">{children}</div>
    </div>
  );
}
