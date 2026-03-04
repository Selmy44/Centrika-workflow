"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

/**
 * ExpenditureRequestForm - Matches Centrika HR PDF layout
 * Table-based structure with blue headers and proper field grouping
 */

interface Props {
  onSuccess?: () => void;
}

export default function ExpenditureRequestForm({ onSuccess }: Props) {
  const autoFillData = useFormAutoFill();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    requestNumber: "",
    employeeName: "",
    staffId: "",
    department: "",
    position: "",
    expenseType: "",
    amount: "",
    currency: "RWF",
    purpose: "",
    reportingManager: "",
  });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      employeeName: autoFillData.employeeName || "",
      staffId: autoFillData.staffId || "",
      department: autoFillData.department || "",
      position: autoFillData.position || "",
      reportingManager: autoFillData.managerId ? String(autoFillData.managerId) : "",
    }));
  }, [autoFillData]);

  const { data: heads = [] } = trpc.users.listHeads.useQuery();
  
  const uniqueHeads = Array.from(
    new Map(heads.map(h => [h.id, h])).values()
  );
  
  const createExpenditure = trpc.requests.createExpenditureRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();

  const handleSubmit = async (submit: boolean) => {
    if (!form.reportingManager) {
      toast.error("Please select a reporting manager");
      return;
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

  return (
    <div className="bg-white text-black border border-blue-600">

      {/* ===== HEADER / LOGO SPACE ===== */}
      <div className="flex justify-between px-6 py-6 border-b border-blue-600">
        <div className="h-16 w-48">
          {/* LOGO PLACEHOLDER – user will insert */}
        </div>
        <div className="text-sm text-right text-blue-700">
          <p>+250 788 123 099</p>
          <p>info@centrika.rw</p>
          <p>www.centrika.rw</p>
          <p>Room F002, 2nd Floor, CHIC Building</p>
          <p>Plot 1007, KN2 Kigali-Rwanda</p>
        </div>
      </div>

      {/* ===== TITLE BAR ===== */}
      <div className="bg-yellow-600 text-white text-center font-bold py-2">
        EXPENDITURE REQUEST FORM
      </div>

      {/* ===== REQUEST DETAILS ===== */}
      <Section title="1. EMPLOYEE INFORMATION">
        <Row label="1.1 Request Number">
          <Input value={form.requestNumber} onChange={e => setForm({ ...form, requestNumber: e.target.value })} />
        </Row>

        <Row label="1.2 Employee Full Name">
          <Input value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} />
        </Row>

        <Row label="1.3 Employee / Staff ID">
          <Input value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })} />
        </Row>

        <Row label="1.4 Department">
          <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
        </Row>

        <Row label="1.5 Position / Title">
          <Input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
        </Row>
      </Section>

      {/* ===== EXPENDITURE DETAILS ===== */}
      <Section title="2. EXPENDITURE DETAILS">
        <Row label="2.1 Type of Expenditure">
          <Input value={form.expenseType} onChange={e => setForm({ ...form, expenseType: e.target.value })} />
        </Row>

        <Row label="2.2 Amount">
          <div className="flex gap-2">
            <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RWF">RWF</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Row>

        <Row label="2.3 Purpose / Justification">
          <Textarea
            className="min-h-[80px]"
            value={form.purpose}
            onChange={e => setForm({ ...form, purpose: e.target.value })}
          />
        </Row>
      </Section>

      {/* ===== APPROVAL ===== */}
      <Section title="3. APPROVAL WORKFLOW">
        <Row label="3.1 Reporting Manager / HOD">
          <Select value={form.reportingManager} onValueChange={v => setForm({ ...form, reportingManager: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              {uniqueHeads.map(h => (
                <SelectItem key={h.id} value={String(h.id)}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
      </Section>

      {/* ===== ACTIONS ===== */}
      <div className="flex justify-end gap-4 px-6 py-6 border-t border-blue-600">
        <Button variant="outline" disabled={isSubmitting} onClick={() => handleSubmit(false)}>
          Save Draft
        </Button>
        <Button disabled={isSubmitting} onClick={() => handleSubmit(true)}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Request
        </Button>
      </div>
    </div>
  );
}

/* ========= Helper Components ========= */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-blue-600">
      <div className="bg-blue-700 text-white font-semibold px-4 py-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[260px_1fr] border-b border-blue-600">
      <div className="px-4 py-3 font-medium border-r border-blue-600 bg-blue-50">
        {label}
      </div>
      <div className="px-4 py-2">
        {children}
      </div>
    </div>
  );
}
