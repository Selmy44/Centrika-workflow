"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Eye } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";
import { fileToBase64 } from "@/lib/fileUtils";

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

export default function ExpenditureRequestForm({ requestData, isReadOnly = false, onSuccess }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
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
    signatureMethod: "draw" as "upload" | "draw",
    supportingDocument: null as File | null,
    supportingDocumentUrl: "",
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

  // Fetch saved form data for draft/read-only views
  const savedFormData = (trpc as any).requests.getExpenditureFormData.useQuery(
    { requestId: requestData?.id || 0 },
    { enabled: !!requestData?.id && (isReadOnly || requestData?.status === "draft") }
  );

  const createExpenditure = trpc.requests.createExpenditureRequest.useMutation();
  const updateExpenditure = (trpc as any).requests.updateExpenditureRequest.useMutation();
  const submitRequest = trpc.requests.submitRequest.useMutation();
  const storeFormData = trpc.requests.storeExpenditureFormData.useMutation();
  const uploadAttachment = (trpc as any).requests.uploadAttachment.useMutation();

  // Merge saved form data when available
  useEffect(() => {
    if (savedFormData.data) {
      const d = savedFormData.data;
      setForm((prev: any) => ({
        ...prev,
        ...d, // Spread all saved data first
        // Then explicitly set file/signature fields that can't be serialized
        employeeSignatureUrl: d.employeeSignatureUrl || prev.employeeSignatureUrl,
        signatureFile: null, // Don't restore file objects
        signaturePreview: d.signaturePreview || prev.signaturePreview,
      }));
    }
  }, [savedFormData.data]);

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
      if (!form.amount || Number(form.amount.replace(/,/g, "")) <= 0) {
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
      // Check if we're updating an existing draft request
      const isEditing = requestData?.id && requestData?.status === "draft";
      
      // Parse amount, defaulting to 0 for drafts
      const parsedAmount = form.amount ? Number(form.amount.replace(/,/g, "")) : 0;
      
      const payload = {
        title: form.expenseType || "Expenditure Request",
        amount: parsedAmount || 1, // Use 1 as minimum for validation (>0)
        currency: form.currency,
        department: form.department,
        category: form.expenseType,
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
        let finalSupportingDocUrl = form.supportingDocumentUrl;
        
        // Handle file upload if a new file is selected
        if (form.supportingDocument) {
          try {
            const base64 = await fileToBase64(form.supportingDocument);
            const uploadResult = await uploadAttachment.mutateAsync({
              requestId: requestId,
              fileName: form.supportingDocument.name,
              fileData: base64,
              mimeType: form.supportingDocument.type,
              attachmentType: "supporting_document",
            });
            finalSupportingDocUrl = uploadResult.fileUrl;
          } catch (e) {
            console.error("Failed to upload supporting document", e);
          }
        }

        try {
          await storeFormData.mutateAsync({
            requestId: requestId,
            formData: { 
              ...form, 
              signatureFile: null, 
              supportingDocument: null, 
              supportingDocumentUrl: finalSupportingDocUrl 
            },
          });
        } catch (e) { console.error("Failed to store form data", e); }
      }

      if (submit) {
        await submitRequest.mutateAsync({
          id: requestId,
          initialApproverId: Number(form.reportingManager),
        });
      }

      toast.success(submit ? "🎉 Expenditure request successfully submitted!" : "Draft saved");
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="w-full bg-white dark:bg-[#1f426b] text-black dark:text-slate-100 px-4 leave-form-container relative dark:border-[#2b6cb0]/30">

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

        {/* ===== REQUEST HEADER SECTION - Responsive Grid ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm items-end">
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-[10px] md:text-xs">Department</p>
            <div className="flex gap-0 items-center">
              <span className="text-blue-600 font-bold text-[10px] md:text-xs whitespace-nowrap">CTK - </span>
              <Input
                value={form.department}
                className="w-full h-6 md:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] md:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed border-l-0"
                disabled
              />
            </div>
          </div>
          <div>
            <p className="font-semibold text-blue-600 mb-1 text-[10px] md:text-xs">Date of Request</p>
            <Input
              type="text"
              value={new Date().toISOString().split('T')[0]}
              className="h-6 md:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] md:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-[10px] md:text-xs mb-1">Request Number</p>
            <Input
              value={form.requestNumber}
              className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <p className="font-semibold text-blue-600 text-xs mb-1">Employee Name</p>
            <Input
              value={form.employeeName}
              className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
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
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.2 Employee Full Name">
              <Input
                value={form.employeeName}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.3 Employee / Staff ID">
              <Input
                value={form.staffId}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.4 Department">
              <Input
                value={form.department}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                disabled
              />
            </Row>
            <Row label="1.5 Position / Title">
              <Input
                value={form.position}
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
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
                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs"
              />
            </Row>
            <Row label="2.2 Amount">
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  value={form.amount}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/[^\d.]/g, "");
                    const parts = rawValue.split(".");
                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    setForm({ ...form, amount: parts.join(".") });
                  }}
                  placeholder="0"
                  className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs"
                />
                <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="w-28 h-7 border-blue-300 dark:border-[#3b6dae]/40 text-xs">
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
                className="min-h-20 border-blue-300 dark:border-[#3b6dae]/40 text-xs"
              />
            </Row>
            <Row label="2.4 Proforma Invoice / Quote">
              <div className="space-y-2">
                {!isReadOnly && (
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setForm({ ...form, supportingDocument: e.target.files[0] });
                      }
                    }}
                    className="text-xs"
                  />
                )}
                {form.supportingDocument && <p className="text-xs text-green-600 font-semibold">✓ {form.supportingDocument.name}</p>}
                {form.supportingDocumentUrl && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-blue-600 font-medium">Attached: Document</p>
                    <a href={form.supportingDocumentUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="h-7 py-0 px-2 text-[10px] border-blue-200">
                        <Eye size={12} className="mr-1" />
                        View
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </Row>
          </Section>

          {/* 3. EMPLOYEE SIGNATURE */}
          <Section title="3. EMPLOYEE SIGNATURE">
            <Row label="3.1 Your Signature">
              <div className="space-y-3 w-full">
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      checked={form.signatureMethod === "draw"}
                      onChange={() => setForm({ ...form, signatureMethod: "draw", signatureFile: null })}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Draw Signature</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      checked={form.signatureMethod === "upload"}
                      onChange={() => setForm({ ...form, signatureMethod: "upload", signatureFile: null })}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Upload Image</span>
                  </label>
                </div>

                {form.signatureMethod === "upload" ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <input
                      type="file"
                      accept="image/*"
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
                      className="text-xs block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                    />
                  </div>
                ) : (
                  <SignaturePad 
                    onSave={(dataUrl) => {
                      const file = base64ToFile(dataUrl, "signature.png");
                      setForm({ ...form, signatureFile: file, employeeSignatureUrl: dataUrl });
                    }}
                    onClear={() => {
                      setForm({ ...form, signatureFile: null, employeeSignatureUrl: "" });
                    }}
                  />
                )}
                
                {form.employeeSignatureUrl && (
                   <div className="mt-2 animate-in zoom-in duration-300">
                      <img src={form.employeeSignatureUrl} alt="sig" className="h-16 object-contain border-2 border-blue-100 rounded-xl p-2 bg-white text-black" />
                   </div>
                )}
              </div>
            </Row>
          </Section>

          {/* 4. APPROVAL WORKFLOW */}
          <Section title="4. APPROVAL WORKFLOW">
            <Row label="4.1 Line Manager / HOD">
              <Input
                value={uniqueHeads.find((h: any) => h.id === parseInt(form.reportingManager))?.name || "Not assigned"}
                className="w-full h-8 border-blue-300 dark:border-[#3b6dae]/40 bg-gray-100 dark:bg-[#295482] text-black dark:text-slate-100 font-medium cursor-not-allowed mt-1 mb-1 max-w-[400px]"
                disabled
              />
            </Row>

          </Section>
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-blue-400 dark:border-[#3b6dae]/50 bg-gray-50 dark:bg-[#1a385c] gap-4">
          <div className="flex gap-2">
            {/* Print/Download hidden until approved */}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="border-blue-400 dark:border-[#3b6dae]/50"
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
    <div className={`border-t border-blue-400 dark:border-[#3b6dae]/50 ${className}`}>
      <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children, colSpan = false }: { label: React.ReactNode, children: React.ReactNode, colSpan?: boolean }) {
  return (
    <div className={`grid ${colSpan ? 'grid-cols-1' : 'grid-cols-[220px_1fr]'} border-b border-blue-400 dark:border-[#3b6dae]/50`}>
      {!colSpan && (
        <div className="px-3 py-2 font-medium border-r border-blue-400 dark:border-[#3b6dae]/50 bg-blue-100 text-[#3b6dae] text-xs flex items-center">
          {label}
        </div>
      )}
      <div className="px-3 py-1 flex items-center">{children}</div>
    </div>
  );
}
