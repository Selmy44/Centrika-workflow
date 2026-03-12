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
        <div className="border-t border-blue-400">
          <div className="bg-blue-600 text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

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

          {/* 3. APPROVAL WORKFLOW */}
          <Section title="3. APPROVAL WORKFLOW">
            <Row label="3.1 Reporting Manager / HOD">
              <Select
                value={form.reportingManager}
                onValueChange={v => setForm({ ...form, reportingManager: v })}
              >
                <SelectTrigger className="w-full h-10 border-blue-300 bg-white text-black font-medium focus:ring-blue-500">
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
