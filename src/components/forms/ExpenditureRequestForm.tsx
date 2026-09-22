"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Eye, Paperclip, Save, Send, Plus, Trash2, Calculator, ShoppingBag, Sparkles } from "lucide-react";
import ApprovalChainPreview from "@/components/forms/ApprovalChainPreview";
import { ApprovalRoutePreview } from "@/components/forms/ApprovalRoutePreview";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";
import { fileToBase64 } from "@/lib/fileUtils";
import { exportFormToPdf, getActiveFormElement, printFormElement } from "@/lib/formExport";

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
import { SignaturePad } from "@/components/SignaturePad";
import { FormSignatureSelector } from "@/components/forms/FormSignatureSelector";

const base64ToFile = (base64: string, filename: string) => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

/**
 * ExpenditureRequestForm - Matches LeaveRequestForm design system
 * Logo header, yellow title bar, Section/Row layout, actions bar, footer
 */

interface Props {
  requestData?: any;
  isReadOnly?: boolean;
  onSuccess?: () => void;
}

export interface ExpenditureItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  subtotal: number;
}

export interface SupportingDocument {
  id: string;
  name: string;
  url?: string;
  file?: File | null;
}

export default function ExpenditureRequestForm({ requestData, isReadOnly = false, onSuccess }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const autoFillData = useFormAutoFill();
  const [savingAction, setSavingAction] = useState<"draft" | "submit" | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrintingForm, setIsPrintingForm] = useState(false);
  const saveSignatureToProfile = (trpc as any).auth.saveSignature.useMutation();

  const handlePrint = () => {
    const formElement = getActiveFormElement();
    if (!formElement) { toast.error("Form content not found for printing"); return; }
    try {
      setIsPrintingForm(true);
      printFormElement({ element: formElement, title: `Expenditure Request - ${form.requestNumber || "Document"}` });
    } catch { toast.error("Unable to open print view"); } finally { setIsPrintingForm(false); }
  };

  const handleDownloadPdf = async () => {
    const formElement = getActiveFormElement();
    if (!formElement) { toast.error("Form content not found for export"); return; }
    try {
      setIsExportingPdf(true);
      await exportFormToPdf({ element: formElement, fileName: `expenditure-request-${form.requestNumber || Date.now()}.pdf` });
      toast.success("PDF downloaded successfully");
    } catch { toast.error("Failed to generate PDF"); } finally { setIsExportingPdf(false); }
  };

  const [form, setForm] = useState({
    requestNumber: "",
    employeeName: "",
    staffId: "",
    department: "",
    position: "",
    workEmail: "",
    dateOfEmployment: "",
    expenseType: "",
    amount: "",
    currency: "RWF",
    items: [
      { id: "1", description: "", quantity: 1, unitPrice: "", subtotal: 0 }
    ] as ExpenditureItem[],
    purpose: "",
    reportingManager: "",
    checkedById: "",
    checkedByName: "",
    employeeSignatureUrl: "",
    signaturePreview: "",
    signatureFile: null as File | null,
    signatureMethod: "draw" as "upload" | "draw",
    supportingDocuments: [] as SupportingDocument[],
    supportingDocument: null as File | null,
    supportingDocumentUrl: "",
  });

  const { data: staffList = [] } = (trpc as any).users.listStaffForBackup.useQuery();

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: String(Date.now()), description: "", quantity: 1, unitPrice: "", subtotal: 0 }
      ]
    }));
  };

  const handleRemoveItem = (id: string) => {
    setForm(prev => {
      if (prev.items.length <= 1) return prev;
      const updatedItems = prev.items.filter(item => item.id !== id);
      const total = updatedItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(String(item.unitPrice || 0).replace(/,/g, ""))), 0);
      return {
        ...prev,
        items: updatedItems,
        amount: total > 0 ? total.toLocaleString() : prev.amount
      };
    });
  };

  const handleItemChange = (id: string, field: keyof ExpenditureItem, val: any) => {
    setForm(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        const qty = Number(updated.quantity) || 0;
        const unitP = Number(String(updated.unitPrice || 0).replace(/,/g, "")) || 0;
        updated.subtotal = qty * unitP;
        return updated;
      });

      const total = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      return {
        ...prev,
        items: updatedItems,
        amount: total > 0 ? total.toLocaleString() : prev.amount
      };
    });
  };

  const handleAddSupportingFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;
    const newDocs: SupportingDocument[] = fileArray.map((file) => ({
      id: String(Math.random()).slice(2, 10),
      name: file.name,
      file: file,
    }));
    setForm((prev) => ({
      ...prev,
      supportingDocuments: [...(prev.supportingDocuments || []), ...newDocs],
    }));
  };

  const handleRemoveSupportingDoc = (id: string) => {
    setForm((prev) => ({
      ...prev,
      supportingDocuments: (prev.supportingDocuments || []).filter((doc) => doc.id !== id),
    }));
  };

  // Auto-fill for new forms only — use prev.field || value to never overwrite existing data
  useEffect(() => {
    if (user && autoFillData) {
      const sequence = String(Math.floor(Math.random() * 10000)).padStart(5, '0');
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      const docId = `ER-${new Date().getFullYear()}-${currentMonth}-${sequence}`;

      setForm(prev => ({
        ...prev,
        requestNumber: prev.requestNumber || docId,
        employeeName: prev.employeeName || autoFillData.employeeName || user.name || "",
        staffId: prev.staffId || autoFillData.staffId || "",
        department: prev.department || autoFillData.department || "",
        position: prev.position || autoFillData.position || "",
        workEmail: prev.workEmail || user.email || "",
        dateOfEmployment: prev.dateOfEmployment || autoFillData.dateOfEmployment || "",
        reportingManager: prev.reportingManager || (autoFillData.managerId ? String(autoFillData.managerId) : ""),
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

  // Fetch saved form data for draft/read-only views
  const savedFormData = (trpc as any).requests.getExpenditureFormData.useQuery(
    { requestId: requestData?.id || 0 },
    {
      enabled: !!requestData?.id,
      staleTime: 0,
      refetchInterval: isReadOnly || requestData?.status !== "draft" ? 3000 : false,
      refetchOnWindowFocus: true,
    }
  );

  const createExpenditure = trpc.requests.createExpenditureRequest.useMutation();
  const updateExpenditure = (trpc as any).requests.updateExpenditureRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();
  const storeFormData = trpc.requests.storeExpenditureFormData.useMutation();
  const uploadAttachment = (trpc as any).requests.uploadAttachment.useMutation();

  // Merge requestData fields — always runs, including for read-only/approved views
  const hasMergedRequestData = useRef(false);
  useEffect(() => {
    if (requestData) {
      setForm((prev) => ({
        ...prev,
        // Employee info from requestData.user — critical for read-only views
        employeeName: requestData.user?.name || prev.employeeName,
        staffId: requestData.user?.staffId || prev.staffId,
        department: requestData.user?.department?.name || prev.department,
        position: requestData.user?.position || prev.position,
        workEmail: requestData.user?.email || prev.workEmail,
        dateOfEmployment: requestData.user?.dateOfEmployment || prev.dateOfEmployment,
        // Expenditure-specific fields from expenditureRequest relation
        expenseType: requestData.expenditureRequest?.category || requestData.title || prev.expenseType,
        amount: requestData.expenditureRequest?.amount ? String(requestData.expenditureRequest.amount) : prev.amount,
        currency: requestData.expenditureRequest?.currency || prev.currency,
        purpose: requestData.description || prev.purpose,
        // Manager from DB
        reportingManager: requestData.initialApproverId ? String(requestData.initialApproverId) : prev.reportingManager,
      }));
    }
  }, [requestData]);

  // Merge saved form data when available
  const hasMergedSavedData = useRef(false);
  useEffect(() => {
    if (savedFormData.data && !hasMergedSavedData.current) {
      hasMergedSavedData.current = true;
      const d = savedFormData.data;
      const docsFromSaved = d.supportingDocuments && Array.isArray(d.supportingDocuments) && d.supportingDocuments.length > 0
        ? d.supportingDocuments
        : (d.supportingDocumentUrl ? [{ id: "legacy-1", name: "Supporting Document", url: d.supportingDocumentUrl }] : []);

      setForm((prev: any) => ({
        ...prev,
        ...d,
        supportingDocuments: docsFromSaved.length > 0 ? docsFromSaved : prev.supportingDocuments,
        employeeSignatureUrl: d.employeeSignatureUrl || prev.employeeSignatureUrl,
        supportingDocumentUrl: d.supportingDocumentUrl || prev.supportingDocumentUrl,
        signatureFile: null,
        signaturePreview: d.signaturePreview || prev.signaturePreview,
      }));
    }
  }, [savedFormData.data]);

  const handleSubmit = async (submit: boolean) => {
    if (submit) {
      if (!form.items || form.items.length === 0) {
        toast.error("Please add at least one itemized item");
        return;
      }
      for (let i = 0; i < form.items.length; i++) {
        const itm = form.items[i];
        if (!itm.description || !itm.description.trim()) {
          toast.error(`Please provide description for Item #${i + 1}`);
          return;
        }
        const price = Number(String(itm.unitPrice).replace(/,/g, ""));
        if (isNaN(price) || price <= 0) {
          toast.error(`Please provide a valid unit price for Item #${i + 1}`);
          return;
        }
        if (!itm.quantity || itm.quantity < 1) {
          toast.error(`Quantity for Item #${i + 1} must be at least 1`);
          return;
        }
      }
      if (!form.amount || Number(form.amount.replace(/,/g, "")) <= 0) {
        toast.error("Total amount must be greater than 0");
        return;
      }
      if (!form.purpose.trim()) {
        toast.error("Purpose / justification for this expenditure is required");
        return;
      }
      if (!form.employeeSignatureUrl) {
        toast.error("Please provide your signature");
        return;
      }
      if (!form.reportingManager && !form.checkedById) {
        toast.error("Please select a staff member for 'Checked by'");
        return;
      }
    }

    setSavingAction(submit ? "submit" : "draft");
    try {
      // Check if we're updating an existing draft request
      const isEditing = requestData?.id && requestData?.status === "draft";

      // Parse amount, defaulting to 0 for drafts
      const parsedAmount = form.amount ? Number(form.amount.replace(/,/g, "")) : 0;

      const payload = {
        title: form.purpose ? (form.purpose.length > 80 ? form.purpose.slice(0, 77) + "..." : form.purpose) : "Expenditure Request",
        description: form.purpose,
        amount: parsedAmount || 1, // Use 1 as minimum for validation (>0)
        currency: form.currency,
        department: form.department,
        category: form.items[0]?.description || "Expenditure Request",
      };

      let requestId: number;
      if (isEditing) {
        // Update existing draft
        await updateExpenditure.mutateAsync({
          requestId: requestData.id,
          ...payload,
        });
        requestId = requestData.id;
      } else {
        // Create new request
        const created = await createExpenditure.mutateAsync(payload);
        requestId = (created as any)?.id as number;
      }

      if (requestId) {
        const uploadedDocs: SupportingDocument[] = [];

        // Upload any supporting document files
        for (const doc of (form.supportingDocuments || [])) {
          if (doc.url) {
            uploadedDocs.push({ id: doc.id, name: doc.name, url: doc.url });
          } else if (doc.file) {
            try {
              const base64 = await fileToBase64(doc.file);
              const uploadResult = await uploadAttachment.mutateAsync({
                requestId: requestId,
                fileName: doc.file.name,
                fileData: base64,
                mimeType: doc.file.type || "application/octet-stream",
                attachmentType: "supporting_document",
              });
              uploadedDocs.push({ id: doc.id, name: doc.file.name, url: uploadResult.fileUrl });
            } catch (e) {
              console.error("Failed to upload supporting document", e);
            }
          }
        }

        // Also handle legacy single file if present
        if (form.supportingDocument) {
          try {
            const base64 = await fileToBase64(form.supportingDocument);
            const uploadResult = await uploadAttachment.mutateAsync({
              requestId: requestId,
              fileName: form.supportingDocument.name,
              fileData: base64,
              mimeType: form.supportingDocument.type || "application/octet-stream",
              attachmentType: "supporting_document",
            });
            uploadedDocs.push({ id: "legacy-doc", name: form.supportingDocument.name, url: uploadResult.fileUrl });
          } catch (e) {
            console.error("Failed to upload legacy supporting document", e);
          }
        }

        const primaryDocUrl = uploadedDocs[0]?.url || form.supportingDocumentUrl;

        try {
          await storeFormData.mutateAsync({
            requestId: requestId,
            formData: {
              ...form,
              signatureFile: null,
              supportingDocument: null,
              supportingDocuments: uploadedDocs,
              supportingDocumentUrl: primaryDocUrl,
            },
          });
        } catch (e) { console.error("Failed to store form data", e); }
      }

      if (submit) {
        await submitRequest.mutateAsync({
          id: requestId,
          initialApproverId: Number(form.checkedById || form.reportingManager),
        });
      }

      toast.success(submit ? "🎉 Expenditure request successfully submitted!" : "Draft saved");
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Submission failed");
    } finally {
      setSavingAction(null);
    }
  };

  if (!isAuthenticated) return null;

  // Deterministic request number: prefer saved form data, fall back to DB-derived ID
  const displayRequestNumber = form.requestNumber || (requestData?.id
    ? `ER-${new Date(requestData.createdAt).getFullYear()}-${String(new Date(requestData.createdAt).getMonth() + 1).padStart(2, "0")}-${String(requestData.id).padStart(5, "0")}`
    : "");

  return (
    <div className="w-full bg-white dark:bg-[#1f426b] text-black dark:text-slate-100 px-4 leave-form-container relative dark:border-[#2b6cb0]/30">

      <div>
        {/* ===== HEADER WITH LOGO AND CONTACT INFO ===== */}
        <div className="flex flex-row justify-between items-start px-3 lg:px-6 py-3 gap-4">
          <div className="shrink-0">
            <img
              src="/logo/centrikaLogo.png"
              alt="Centrika Logo"
              className="h-20 lg:h-24 w-auto"
            />
          </div>
          <div className="text-xs flex justify-end">
            <div className="flex flex-col gap-1.5 items-start">
              <div className="flex items-center gap-2 min-w-0">
                <Phone size={13} className="text-blue-600 shrink-0" />
                <span className="text-blue-600 font-semibold truncate text-[11px]">+250 788 123 099</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Mail size={13} className="text-blue-600 shrink-0" />
                <span className="text-blue-600 font-semibold truncate text-[11px]">info@centrika.rw</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Globe size={13} className="text-blue-600 shrink-0" />
                <span className="text-blue-600 font-semibold truncate text-[11px]">www.centrika.rw</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-blue-600 font-semibold text-[10px] leading-tight">Room F002, 2nd Floor, CHIC Building,</span>
                  <span className="text-blue-600 font-semibold text-[10px] leading-tight">Plot 1007, KN2 Kigali-Rwanda</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== TITLE BAR (YELLOW) ===== */}
        <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide">
          EXPENDITURE REQUEST FORM
        </div>

        {/* ===== REQUEST HEADER SECTION (hidden — kept for future use) =====
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-3 px-3 lg:px-6 py-2 lg:py-3 text-xs lg:text-sm items-end">
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-[10px] lg:text-xs">CTK</p>
            <div className="flex gap-0 items-center">
              <Input value="CTK" className="w-full h-6 lg:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] lg:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
            </div>
          </div>
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-[10px] lg:text-xs">Date of Request</p>
            <Input type="text" value={new Date().toISOString().split('T')[0]} className="h-6 lg:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] lg:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-[10px] lg:text-xs mb-1">Request Number</p>
            <Input value={displayRequestNumber} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Employee Name</p>
            <Input value={form.employeeName} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
          </div>
        </div>
        ===== */}

        {/* ===== REQUEST DETAILS ===== */}
        <div className="border-t border-[#3b6dae]">
          <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

          {/* 1. EMPLOYEE INFORMATION */}
          <Section title="1. EMPLOYEE INFORMATION">
            <Row label="1.1 Request Number">
              <Input
                value={displayRequestNumber}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.2 Employee Full Name">
              <Input
                value={form.employeeName}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.3 Department">
              <Input
                value={form.department}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                disabled
              />
            </Row>
          </Section>

          {/* 2. EXPENDITURE DETAILS */}
          <Section title="2. EXPENDITURE DETAILS">
            <Row label="2.1 Items / Assets Breakdown" colSpan>
              <div className="w-full my-2 space-y-3">
                {/* Live Summary Bar */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1a385c] dark:to-[#224775] border border-blue-200 dark:border-[#3b6dae]/40 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#3b6dae] dark:text-blue-300">
                    <ShoppingBag size={16} />
                    <span>Itemized Assets & Expenditures Breakdown</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-white dark:bg-[#1f426b] px-2.5 py-1 rounded-full border border-blue-200 dark:border-[#3b6dae]/30 font-medium text-gray-700 dark:text-slate-200">
                      {form.items.length} {form.items.length === 1 ? 'Item' : 'Items'}
                    </span>
                    <div className="flex items-center gap-1.5 bg-[#3b6dae] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      <Calculator size={13} />
                      <span>Total: {form.currency} {(form.items.reduce((s, i) => s + (i.subtotal || 0), 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto rounded-lg border border-blue-200 dark:border-[#3b6dae]/30">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-blue-100 dark:bg-[#295482] text-[#3b6dae] dark:text-slate-200 font-semibold">
                      <tr>
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5 min-w-[200px]">Item / Asset Description</th>
                        <th className="p-2.5 w-24 text-center">Qty</th>
                        <th className="p-2.5 w-36">Unit Price ({form.currency})</th>
                        <th className="p-2.5 w-36 text-right">Subtotal ({form.currency})</th>
                        {!isReadOnly && <th className="p-2.5 w-12 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#3b6dae]/20 bg-white dark:bg-[#1f426b]">
                      {form.items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/40 transition-colors">
                          <td className="p-2.5 text-center font-medium text-gray-500 dark:text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-2">
                            <Input
                              value={item.description}
                              onChange={e => handleItemChange(item.id, "description", e.target.value)}
                              placeholder={`Asset/Item #${idx + 1} name or specs`}
                              className="h-7 text-xs border-blue-200 dark:border-[#3b6dae]/30"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e => handleItemChange(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                              className="h-7 text-xs text-center border-blue-200 dark:border-[#3b6dae]/30"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="text"
                              value={item.unitPrice}
                              onChange={e => {
                                const raw = e.target.value.replace(/[^\d.]/g, "");
                                handleItemChange(item.id, "unitPrice", raw);
                              }}
                              placeholder="0"
                              className="h-7 text-xs border-blue-200 dark:border-[#3b6dae]/30"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2.5 text-right font-semibold text-blue-900 dark:text-blue-100">
                            {(item.subtotal || 0).toLocaleString()}
                          </td>
                          {!isReadOnly && (
                            <td className="p-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={form.items.length <= 1}
                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-blue-50 dark:bg-[#1a385c] font-bold border-t-2 border-blue-200 dark:border-[#3b6dae]/40">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right text-gray-700 dark:text-slate-200">
                          Grand Total Amount:
                        </td>
                        <td className="p-2.5 text-right text-sm text-[#3b6dae] dark:text-blue-300">
                          {form.currency} {(form.items.reduce((s, i) => s + (i.subtotal || 0), 0)).toLocaleString()}
                        </td>
                        {!isReadOnly && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="mt-2 border-dashed border-blue-400 dark:border-[#3b6dae]/50 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-[#1a385c] h-8 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    Add Another Item / Asset
                  </Button>
                )}
              </div>
            </Row>

            <Row label="2.2 Total Amount & Currency">
              <div className="flex gap-2 items-center w-full">
                <Input
                  type="text"
                  value={form.amount || (form.items.reduce((s, i) => s + (i.subtotal || 0), 0)).toLocaleString()}
                  placeholder="0"
                  className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                  disabled
                />
                <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })} disabled={isReadOnly}>
                  <SelectTrigger className={`w-28 h-7 border-blue-300 dark:border-[#3b6dae]/40 text-xs ${isReadOnly ? 'bg-gray-100 dark:bg-[#295482] cursor-not-allowed' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1f426b] border-blue-200 dark:border-[#3b6dae]/30">
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
                className={`min-h-20 border-blue-300 dark:border-[#3b6dae]/40 text-xs ${isReadOnly ? 'bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100' : ''}`}
                disabled={isReadOnly}
              />
            </Row>
            <Row label="2.4 Supporting doc" className="no-print">
              <div className="space-y-2.5 w-full">
                {/* List of attached documents */}
                {(form.supportingDocuments || []).length > 0 && (
                  <div className="space-y-2 max-w-2xl">
                    {(form.supportingDocuments || []).map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 bg-blue-50/70 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-2.5"
                      >
                        <Paperclip size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-medium text-blue-900 dark:text-blue-100 flex-1 truncate">
                          {doc.name}
                        </span>
                        {doc.url && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" type="button" className="h-6 py-0 px-2 text-[10px] border-blue-200">
                              <Eye size={12} className="mr-1" /> View
                            </Button>
                          </a>
                        )}
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSupportingDoc(doc.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold px-1"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Legacy single document display fallback if supportingDocuments empty */}
                {(form.supportingDocuments || []).length === 0 && form.supportingDocumentUrl && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-blue-600 font-medium">Attached Document</p>
                    <a href={form.supportingDocumentUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" type="button" className="h-7 py-0 px-2 text-[10px] border-blue-200">
                        <Eye size={12} className="mr-1" />
                        View
                      </Button>
                    </a>
                  </div>
                )}

                {/* Upload Button */}
                {!isReadOnly && (
                  <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-[#3b6dae]/50 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/50 transition-all duration-200 w-fit">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      + Attach supporting doc(s)
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleAddSupportingFiles(e.target.files);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </Row>
          </Section>

          {/* 3. EMPLOYEE SIGNATURE */}
          <Section title="3. EMPLOYEE SIGNATURE">
            {isReadOnly ? (
              <div className="p-3 bg-white dark:bg-[#1f426b] flex flex-col items-start justify-start min-h-[75px]">
                {form.employeeSignatureUrl ? (
                  <>
                    <img src={form.employeeSignatureUrl} alt="Employee Signature" className="h-12 max-h-12 object-contain" />
                    <p className="text-[11px] text-gray-900 dark:text-slate-100 mt-1 font-semibold text-left">{form.employeeName || requestData?.user?.name || ""}</p>
                  </>
                ) : (
                  <p className="text-xs italic text-gray-400">No signature provided</p>
                )}
              </div>
            ) : (
              <Row label="Signature">
                <div className="space-y-3 w-full">
                  <FormSignatureSelector
                    value={form.employeeSignatureUrl}
                    initialFile={form.signatureFile}
                    onChange={({ dataUrl, file, saveToProfile }) => {
                      setForm((prev: any) => ({
                        ...prev,
                        employeeSignatureUrl: dataUrl,
                        signatureFile: file,
                        signaturePreview: dataUrl,
                      }));
                      if (saveToProfile && dataUrl) {
                        saveSignatureToProfile.mutate({ signatureUrl: dataUrl });
                      }
                    }}
                  />
                </div>
              </Row>
            )}
          </Section>

          {/* 4. APPROVER SIGNATURES */}
          <Section title="4. APPROVER SIGNATURES">
            {isReadOnly ? (
              (() => {
                const hodApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "head_of_department");
                const hodName = savedFormData.data?.managerSignerName || savedFormData.data?.checkedByName || hodApproval?.approver?.name || form.checkedByName || "HOD";
                const hodSig = savedFormData.data?.managerSignatureUrl || hodApproval?.signature?.fileUrl || requestData?.managerSignatureUrl;

                const finApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "head_of_finance");
                const finName = savedFormData.data?.financeSignerName || savedFormData.data?.reviewedByName || finApproval?.approver?.name || "Head of Finance";
                const finSig = savedFormData.data?.financeSignatureUrl || finApproval?.signature?.fileUrl || requestData?.financeSignatureUrl;

                const ceoApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "ceo_md" || a.approvalLevel === "md");
                const ceoName = savedFormData.data?.ceoSignerName || savedFormData.data?.approvedByName || ceoApproval?.approver?.name || "CEO / MD";
                const ceoSig = savedFormData.data?.ceoSignatureUrl || ceoApproval?.signature?.fileUrl || requestData?.ceoSignatureUrl;
                const isCeoNotRequired = !ceoSig && requestData?.status === "approved";

                return (
                  <div className="grid grid-cols-3 divide-x divide-blue-200 dark:divide-[#3b6dae]/30 border-b border-blue-200 dark:border-[#3b6dae]/30">
                    {/* 4.1 Checked by */}
                    <div className="p-2.5 flex flex-col justify-between min-h-[85px] bg-white dark:bg-[#1f426b]">
                      <div className="text-center mb-1">
                        <span className="text-[10px] font-bold text-[#3b6dae] dark:text-blue-300 uppercase tracking-wider">4.1 Checked by</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center my-1">
                        {hodSig ? (
                          <img src={hodSig} alt="Checked by Signature" className="h-10 max-h-10 object-contain" />
                        ) : (
                          <p className="text-[10px] italic text-gray-400">Signature pending</p>
                        )}
                      </div>
                      <div className="border-t border-gray-100 dark:border-slate-700/60 pt-1">
                        <p className="text-[11px] font-semibold text-gray-900 dark:text-slate-100 truncate text-center">{hodName}</p>
                      </div>
                    </div>

                    {/* 4.2 Reviewed by */}
                    <div className="p-2.5 flex flex-col justify-between min-h-[85px] bg-white dark:bg-[#1f426b]">
                      <div className="text-center mb-1">
                        <span className="text-[10px] font-bold text-[#3b6dae] dark:text-blue-300 uppercase tracking-wider">4.2 Reviewed by</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center my-1">
                        {finSig ? (
                          <img src={finSig} alt="Reviewed by Signature" className="h-10 max-h-10 object-contain" />
                        ) : (
                          <p className="text-[10px] italic text-gray-400">Signature pending</p>
                        )}
                      </div>
                      <div className="border-t border-gray-100 dark:border-slate-700/60 pt-1">
                        <p className="text-[11px] font-semibold text-gray-900 dark:text-slate-100 truncate text-center">{finName}</p>
                      </div>
                    </div>

                    {/* 4.3 Approved by */}
                    <div className="p-2.5 flex flex-col justify-between min-h-[85px] bg-white dark:bg-[#1f426b]">
                      <div className="text-center mb-1">
                        <span className="text-[10px] font-bold text-[#3b6dae] dark:text-blue-300 uppercase tracking-wider">4.3 Approved by</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center my-1">
                        {ceoSig ? (
                          <img src={ceoSig} alt="Approved by Signature" className="h-10 max-h-10 object-contain" />
                        ) : isCeoNotRequired ? (
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                            Not required (Concluded at Review)
                          </span>
                        ) : (
                          <p className="text-[10px] italic text-gray-400">Signature pending</p>
                        )}
                      </div>
                      <div className="border-t border-gray-100 dark:border-slate-700/60 pt-1">
                        <p className="text-[11px] font-semibold text-gray-900 dark:text-slate-100 truncate text-center">
                          {isCeoNotRequired ? "N/A" : ceoName}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <>
                <Row label="4.1 Checked by">
                  <div className="w-full space-y-1.5 py-1">
                    <Select
                      value={String(form.checkedById || form.reportingManager || "")}
                      onValueChange={(val) => {
                        const selected = staffList.find((s: any) => String(s.id) === String(val));
                        setForm({
                          ...form,
                          reportingManager: val,
                          checkedById: val,
                          checkedByName: selected?.name || "",
                        });
                      }}
                    >
                      <SelectTrigger className="w-full h-8 border-blue-300 dark:border-[#3b6dae]/40 text-xs bg-white dark:bg-[#1a385c]">
                        <SelectValue placeholder="Select staff member to check this request..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 bg-white dark:bg-[#1f426b] border-blue-200 dark:border-[#3b6dae]/30">
                        {staffList.map((staff: any) => (
                          <SelectItem key={staff.id} value={String(staff.id)} className="text-xs cursor-pointer">
                            <div className="flex items-center gap-2 py-0.5">
                              <span className="font-semibold text-gray-900 dark:text-slate-100">{staff.name}</span>
                              {staff.department && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-300 font-medium">({staff.department})</span>
                              )}
                              {staff.position && (
                                <span className="text-[10px] text-gray-500 dark:text-slate-400">• {staff.position}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Row>
                <Row label="4.2 Reviewed by">
                  <div className="py-1">
                    <p className="text-xs italic text-gray-500 dark:text-gray-400">
                      To be selected by the Checked-by approver
                    </p>
                  </div>
                </Row>
                <Row label="4.3 Approved by">
                  <div className="py-1">
                    <p className="text-xs italic text-gray-500 dark:text-gray-400">
                      To be selected by the Reviewed-by approver
                    </p>
                  </div>
                </Row>
              </>
            )}
          </Section>

          {/* Draft-only: approval route preview (placed after Section 4) */}
          {!isReadOnly && (() => {
            const empInitials = (user?.name || "Me").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            const selectedStaff = staffList.find((s: any) => String(s.id) === String(form.checkedById || form.reportingManager));
            const mgrName = selectedStaff?.name || form.checkedByName || "Select Staff Member";
            const mgrInitials = selectedStaff ? mgrName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "HOD";
            return (
              <ApprovalRoutePreview steps={[
                { initials: empInitials, name: user?.name || "You", role: "Initiated by", isSubmitter: true },
                { initials: mgrInitials, name: mgrName, role: "Checked by" },
                { initials: "REV", name: "To be assigned", role: "Reviewed by" },
                { initials: "APP", name: "To be assigned", role: "Approved by" },
              ]} />
            );
          })()}


          {/* 5. APPROVAL CHAIN (preview) - Hidden on Print and PDF */}
          {(isReadOnly || requestData?.status === "pending" || requestData?.status === "approved" || requestData?.status === "rejected") && (
            <Section title="5. APPROVAL CHAIN (preview)" className="no-print">
              <div className="px-3 lg:px-4 py-3 lg:py-4">
                <ApprovalChainPreview
                  requestType="expenditure"
                  currentApprovalLevel={requestData?.currentApprovalLevel}
                  status={requestData?.status || "draft"}
                  approvals={requestData?.approvals || []}
                />
              </div>
            </Section>
          )}
        </div>

        {/* ===== ACTIONS ===== */}
        {(!isReadOnly || (requestData?.status && requestData.status !== "draft")) && (
          <div className={`no-print ${requestData?.status && requestData.status !== "draft" ? 'flex flex-col lg:flex-row justify-between items-stretch lg:items-center px-3 lg:px-6 py-3 lg:py-4 bg-gray-50 dark:bg-[#1a385c] gap-2 lg:gap-4' : 'sticky bottom-0 z-50 flex flex-col sm:flex-row justify-between items-center gap-3 px-4 lg:px-6 py-3 bg-white dark:bg-[#1a385c] border-t-2 border-[#3b6dae]/20 shadow-[0_-2px_12px_rgba(59,109,174,0.08)] mt-6 rounded-b-lg'}`}>
            {requestData?.status && requestData.status !== "draft" ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" type="button" disabled={isPrintingForm} onClick={handlePrint} className="border-blue-400 dark:border-[#3b6dae]/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#1f426b] h-9 font-semibold text-xs flex items-center gap-1.5">
                  {isPrintingForm ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer size={14} />}
                  Print Form
                </Button>
                <Button variant="outline" size="sm" type="button" disabled={isExportingPdf} onClick={handleDownloadPdf} className="border-blue-400 dark:border-[#3b6dae]/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#1f426b] h-9 font-semibold text-xs flex items-center gap-1.5">
                  {isExportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download size={14} />}
                  Download PDF
                </Button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-400 hidden sm:block">
                <span className="font-semibold text-[#3b6dae] dark:text-blue-400">💾 Tip:</span> Save as draft to continue later
              </p>
            )}
            {!isReadOnly && (
              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <Button variant="outline" disabled={savingAction !== null} type="button" onClick={() => handleSubmit(false)} className="flex-1 sm:flex-none min-w-[140px] border-[#3b6dae]/40 text-[#3b6dae] dark:text-blue-300 dark:border-[#3b6dae]/40 hover:bg-blue-50 dark:hover:bg-[#1f426b] h-9 font-semibold text-xs">
                  {savingAction === "draft" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {savingAction === "draft" ? "Saving..." : "Save Draft"}
                </Button>
                <Button disabled={savingAction !== null} type="button" onClick={() => handleSubmit(true)} className="flex-1 sm:flex-none min-w-[140px] bg-[#3b6dae] hover:bg-[#2d5a9e] text-white h-9 font-semibold text-xs transition-colors">
                  {savingAction === "submit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {savingAction === "submit" ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ===== FOOTER ===== */}
        <div className="text-center text-xs text-gray-600 dark:text-slate-400 py-3 border-t border-gray-200 space-y-1">
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
    <div className={className}>
      <div className="bg-[#3b6dae] text-white font-bold px-4 py-1.5 text-xs tracking-wide">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children, colSpan = false, className = "" }: { label: React.ReactNode, children: React.ReactNode, colSpan?: boolean, className?: string }) {
  return (
    <div className={`grid ${colSpan ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[220px_1fr]'} gap-0 ${className}`}>
      {!colSpan && (
        <div className="px-2 lg:px-3 py-1.5 lg:py-2 font-medium bg-blue-100/70 dark:bg-[#1a385c] text-[#3b6dae] dark:text-blue-300 text-[10px] lg:text-xs flex items-center">
          {label}
        </div>
      )}
      <div className="px-2 lg:px-3 py-1 flex items-center">{children}</div>
    </div>
  );
}
