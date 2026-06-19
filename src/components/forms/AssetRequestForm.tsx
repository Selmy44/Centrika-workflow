"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Package, Eye, Paperclip } from "lucide-react";
import ApprovalChainPreview from "@/components/forms/ApprovalChainPreview";
import { ApprovalRoutePreview } from "@/components/forms/ApprovalRoutePreview";
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
 * AssetRequestForm - Dynamic Asset/Property Approval Workflow
 * Logo header, yellow title bar, Section/Row layout, actions bar, footer
 */

interface Props {
    requestData?: any;
    isReadOnly?: boolean;
    onSuccess?: () => void;
}

export default function AssetRequestForm({ requestData, isReadOnly = false, onSuccess }: Props) {
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
        workEmail: "",
        dateOfEmployment: "",
        title: "",
        itemName: "",
        category: "",
        estimatedCost: "",
        currency: "RWF",
        description: "",
        reportingManager: "",
        employeeSignatureUrl: "",
        signaturePreview: "",
        signatureFile: null as File | null,
        signatureMethod: "draw" as "upload" | "draw",
        supportingDocument: null as File | null,
        supportingDocumentUrl: "",
    });

    useEffect(() => {
        if (requestData) {
            setForm(prev => ({
                ...prev,
                requestNumber: requestData.requestNumber || prev.requestNumber,
                employeeName: requestData.user?.name || requestData.employeeName || prev.employeeName,
                staffId: requestData.user?.staffId || requestData.staffId || prev.staffId,
                department: requestData.user?.department?.name || requestData.department || prev.department,
                position: requestData.user?.position || requestData.position || prev.position,
                dateOfEmployment: requestData.user?.dateOfEmployment || requestData.dateOfEmployment || prev.dateOfEmployment,
                title: requestData.title || prev.title,
                itemName: requestData.itemName || prev.itemName,
                category: requestData.category || prev.category,
                estimatedCost: requestData.estimatedCost || prev.estimatedCost,
                currency: requestData.currency || prev.currency,
                description: requestData.description || prev.description,
                reportingManager: requestData.initialApproverId || prev.reportingManager,
            }));
        } else if (user && autoFillData) {
            const sequence = String(Math.floor(Math.random() * 10000)).padStart(5, '0');
            const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
            const docId = `AR-${new Date().getFullYear()}-${currentMonth}-${sequence}`;

            setForm(prev => ({
                ...prev,
                requestNumber: docId,
                employeeName: autoFillData.employeeName || user.name || "",
                staffId: autoFillData.staffId || "",
                department: autoFillData.department || "",
                position: autoFillData.position || "",
                workEmail: user.email || "",
                dateOfEmployment: autoFillData.dateOfEmployment || "",
                reportingManager: autoFillData.managerId ? String(autoFillData.managerId) : "",
            }));
        }
    }, [user, autoFillData, requestData]);

    const { data: heads = [] } = trpc.users.listHeads.useQuery(undefined, {
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        retry: 1,
    });

    // Fetch saved form data for draft/read-only views
    const savedFormData = (trpc as any).requests.getAssetFormData.useQuery(
        { requestId: requestData?.id || 0 },
        {
          enabled: !!requestData?.id && (isReadOnly || requestData?.status === "draft"),
          staleTime: 5 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
          refetchOnWindowFocus: false,
        }
    );

    const uniqueHeads = Array.from(
        new Map(heads.map((h: any) => [h.id, h])).values()
    );

    const createAsset = trpc.requests.createAssetRequest.useMutation();
    const updateAsset = (trpc as any).requests.updateAssetRequest.useMutation();
    const submitRequest = trpc.requests.submitRequest.useMutation();
    const storeFormData = trpc.requests.storeAssetFormData.useMutation();
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
                toast.error("Please select a Line Manager / HOD before submitting");
                return;
            }
            if (!form.title.trim()) {
                toast.error("Request title is required");
                return;
            }
            if (!form.itemName.trim()) {
                toast.error("Item name is required");
                return;
            }
            if (!form.estimatedCost || Number(form.estimatedCost.replace(/,/g, "")) <= 0) {
                toast.error("Estimated cost must be greater than 0");
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
            
            // Parse estimated cost, defaulting to 0 for drafts
            const parsedCost = form.estimatedCost ? Number(form.estimatedCost.replace(/,/g, "")) : 0;
            
            const payload = {
                title: form.title || `Asset Request: ${form.itemName}`,
                itemName: form.itemName,
                description: form.description,
                estimatedCost: parsedCost || 1, // Use 1 as minimum for validation (>0)
                currency: form.currency,
                category: form.category,
            };

            let requestId: number;
            if (isEditing) {
                // Update existing draft
                await updateAsset.mutateAsync({
                    requestId: requestData.id,
                    ...payload,
                });
                requestId = requestData.id;
            } else {
                // Create new request
                const created = await createAsset.mutateAsync(payload);
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
                        requestId,
                        formData: { ...form, signatureFile: null, supportingDocument: null, supportingDocumentUrl: finalSupportingDocUrl },
                    });
                } catch (e) { console.error("Failed to store form data", e); }
            }

            if (submit) {
                await submitRequest.mutateAsync({
                    id: requestId,
                    initialApproverId: Number(form.reportingManager),
                });
            }

            toast.success(submit ? "🎉 Asset request successfully submitted!" : "Draft saved");
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
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start px-3 lg:px-6 py-3 gap-4 lg:gap-8">
                    <div className="shrink-0">
                        <img
                            src="/logo/centrikaLogo.png"
                            alt="Centrika Logo"
                            className="h-14 lg:h-20 w-auto"
                        />
                    </div>
                    <div className="text-xs lg:text-sm flex-1 flex justify-start lg:justify-end">
                        <div className="flex flex-col gap-2 lg:gap-3 items-start">
                            <div className="flex items-center gap-2 min-w-0">
                                <Phone size={14} className="text-blue-600 shrink-0 lg:w-[16px] lg:h-[16px]" />
                                <span className="text-blue-600 font-semibold truncate text-[11px] lg:text-sm">+250 788 123 099</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <Mail size={14} className="text-blue-600 shrink-0 lg:w-[16px] lg:h-[16px]" />
                                <span className="text-blue-600 font-semibold truncate text-[11px] lg:text-sm">info@centrika.rw</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <Globe size={14} className="text-blue-600 shrink-0 lg:w-[16px] lg:h-[16px]" />
                                <span className="text-blue-600 font-semibold truncate text-[11px] lg:text-sm">www.centrika.rw</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5 lg:w-[16px] lg:h-[16px]" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-blue-600 font-semibold text-[10px] lg:text-sm leading-tight">Room F002, 2nd Floor, CHIC Building,</span>
                                    <span className="text-blue-600 font-semibold text-[10px] lg:text-sm leading-tight">Plot 1007, KN2 Kigali-Rwanda</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== TITLE BAR (YELLOW) ===== */}
                <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide shadow-sm uppercase">
                    Asset / Property Request Form
                </div>

                {/* ===== REQUEST HEADER SECTION (hidden — kept for future use) =====
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-3 px-3 lg:px-6 py-2 lg:py-3 text-xs lg:text-sm items-end">
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-[10px] lg:text-xs uppercase tracking-tighter">CTK</p>
                        <div className="flex gap-0 items-center">
                            <Input value="CTK" className="w-full h-6 lg:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] lg:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-[10px] lg:text-xs uppercase tracking-tighter">Date of Request</p>
                        <Input type="text" value={new Date().toISOString().split('T')[0]} className="h-6 lg:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] lg:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-[10px] lg:text-xs mb-1 uppercase tracking-tighter">Request Number</p>
                        <Input value={form.requestNumber} className="h-6 lg:h-7 border-blue-400 dark:border-[#3b6dae]/50 text-[10px] lg:text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1 uppercase tracking-tighter">Employee Name</p>
                        <Input value={form.employeeName} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
                    </div>
                </div>
                ===== */}

                {/* ===== REQUEST DETAILS ===== */}
                <div className="border-t border-[#3b6dae]">
                    <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm flex items-center gap-2">
                        <Package size={16} /> ASSET REQUEST DETAILS
                    </div>

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
                        <Row label="1.3 Department">
                            <Input
                                value={form.department}
                                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                                disabled
                            />
                        </Row>
                        <Row label="1.4 Employee / Staff ID">
                            <Input
                                value={form.staffId}
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
                        <Row label="1.6 Date of Employment">
                            <Input
                                type="date"
                                value={form.dateOfEmployment}
                                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                                disabled
                            />
                        </Row>
                        <Row label="1.7 Work Email">
                            <Input
                                value={form.workEmail}
                                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium"
                                disabled
                            />
                        </Row>
                    </Section>

                    {/* 2. ASSET DETAILS */}
                    <Section title="2. ASSET / PROPERTY DETAILS">
                        <Row label="2.1 Request Title">
                            <Input
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g., Replacement Laptop for IT Dept"
                                className="border-blue-300 dark:border-[#3b6dae]/40 h-8 text-xs font-medium"
                                disabled={isReadOnly}
                            />
                        </Row>
                        <Row label="2.2 Item Name">
                            <Input
                                value={form.itemName}
                                onChange={e => setForm({ ...form, itemName: e.target.value })}
                                placeholder="e.g., MacBook Pro M3, Office Desk, etc."
                                className="border-blue-300 dark:border-[#3b6dae]/40 h-8 text-xs"
                                disabled={isReadOnly}
                            />
                        </Row>
                        <Row label="2.3 Asset Category">
                            <Select 
                                value={form.category} 
                                onValueChange={v => setForm({ ...form, category: v })}
                                disabled={isReadOnly}
                            >
                                <SelectTrigger className="w-full h-8 border-blue-300 dark:border-[#3b6dae]/40 text-xs">
                                    <SelectValue placeholder="-- Select Category --" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#1f426b] border-blue-200 dark:border-[#3b6dae]/30">
                                    <SelectItem value="it_equipment" className="focus:bg-blue-500 focus:text-white">IT Equipment</SelectItem>
                                    <SelectItem value="furniture" className="focus:bg-blue-500 focus:text-white">Furniture</SelectItem>
                                    <SelectItem value="office_supplies" className="focus:bg-blue-500 focus:text-white">Office Supplies</SelectItem>
                                    <SelectItem value="other" className="focus:bg-blue-500 focus:text-white">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </Row>
                        <Row label="2.4 Estimated Cost">
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="text"
                                    value={form.estimatedCost}
                                    onChange={e => {
                                        const rawValue = e.target.value.replace(/[^\d.]/g, "");
                                        const parts = rawValue.split(".");
                                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                        setForm({ ...form, estimatedCost: parts.join(".") });
                                    }}
                                    placeholder="0"
                                    className="border-blue-300 dark:border-[#3b6dae]/40 h-8 text-xs font-bold text-blue-800"
                                    disabled={isReadOnly}
                                />
                                <Select 
                                    value={form.currency} 
                                    onValueChange={v => setForm({ ...form, currency: v })}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger className="w-28 h-8 border-blue-300 dark:border-[#3b6dae]/40 text-xs">
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
                        <Row label="2.5 Specific Description / Specs">
                            <Textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Provide detailed specifications, reason for request, and any other relevant information..."
                                className="min-h-24 border-blue-300 dark:border-[#3b6dae]/40 text-xs"
                                disabled={isReadOnly}
                            />
                        </Row>
                        <Row label="2.6 Technical Specifications / Quote">
                            <div className="space-y-2">
                                {!isReadOnly && (
                                    form.supportingDocument ? (
                                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3">
                                            <Paperclip size={14} className="text-blue-600 shrink-0" />
                                            <span className="text-xs font-medium text-blue-800 dark:text-blue-200 flex-1 truncate">{form.supportingDocument.name}</span>
                                            <button type="button" onClick={() => setForm({ ...form, supportingDocument: null })} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                                        </div>
                                    ) : (
                                        <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-[#3b6dae]/50 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/50 transition-all duration-200 w-fit">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+ Attach specs / quote</span>
                                            <input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { setForm({ ...form, supportingDocument: e.target.files[0] }); } }} />
                                        </label>
                                    )
                                )}
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
                        <Row label="2.7 Line Manager / HOD">
                            {isReadOnly ? (
                                <Input
                                    value={
                                        (() => {
                                            const found = uniqueHeads.find((h: any) => h.id === Number(form.reportingManager));
                                            return (found as any)?.name || (form.reportingManager ? `ID: ${form.reportingManager}` : "Not assigned");
                                        })()
                                    }
                                    className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                                    disabled
                                />
                            ) : (
                                <div className="flex flex-col gap-1 w-full">
                                    <Select
                                        value={form.reportingManager}
                                        onValueChange={v => setForm((prev: any) => ({ ...prev, reportingManager: v }))}
                                    >
                                        <SelectTrigger className="w-full h-8 border-blue-300 dark:border-[#3b6dae]/40 text-xs">
                                            <SelectValue placeholder="-- Select Line Manager / HOD --" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1f426b] border-blue-200 dark:border-[#3b6dae]/30">
                                            {(uniqueHeads as any[]).map((h: any) => (
                                                <SelectItem key={h.id} value={String(h.id)} className="focus:bg-blue-500 focus:text-white">
                                                    {h.name}{h.department?.name ? ` — ${h.department.name}` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!form.reportingManager && (
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                            ⚠ Required — select your Line Manager or Head of Department
                                        </p>
                                    )}
                                    {form.reportingManager && (
                                        <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                                            ✓ Auto-resolved from your profile. Change if needed.
                                        </p>
                                    )}
                                </div>
                            )}
                        </Row>
                    </Section>

                    {/* 3. EMPLOYEE SIGNATURE */}
                    <Section title="3. EMPLOYEE SIGNATURE">
                        <Row label="3.1 Your Signature">
                            <div className="space-y-3 w-full">
                                {isReadOnly ? (
                                    <div className="space-y-1">
                                        {form.employeeSignatureUrl ? (
                                          <>
                                            <img src={form.employeeSignatureUrl} alt="sig" className="h-16 object-contain" />
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{form.employeeName || requestData?.user?.name || ""}</p>
                                          </>
                                        ) : <p className="text-xs italic text-gray-500">No signature</p>}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-2 mb-3">
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, signatureMethod: "draw", signatureFile: null, employeeSignatureUrl: "" })}
                                                className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                                                    form.signatureMethod === "draw"
                                                        ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                                                        : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"
                                                } cursor-pointer`}
                                            >
                                                Draw
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, signatureMethod: "upload", signatureFile: null, employeeSignatureUrl: "" })}
                                                className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                                                    form.signatureMethod === "upload"
                                                        ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                                                        : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"
                                                } cursor-pointer`}
                                            >
                                                Upload image
                                            </button>
                                        </div>

                                        {form.signatureMethod === "upload" ? (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                {form.employeeSignatureUrl ? (
                                                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3">
                                                        <Paperclip size={14} className="text-blue-600 shrink-0" />
                                                        <span className="text-xs font-medium text-blue-800 dark:text-blue-200 flex-1 truncate">{form.signatureFile?.name || "Signature image"}</span>
                                                        <button type="button" onClick={() => setForm({ ...form, signatureFile: null, employeeSignatureUrl: "" })} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-[#3b6dae]/50 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/50 transition-all duration-200 w-fit">
                                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+ Upload signature image</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (ev) => {
                                                                    setForm({ ...form, signatureFile: file, signaturePreview: URL.createObjectURL(file), employeeSignatureUrl: ev.target?.result as string });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }} />
                                                    </label>
                                                )}
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
                                        
                                        {form.employeeSignatureUrl && form.signatureMethod === "upload" && (
                                           <div className="mt-2 animate-in zoom-in duration-300">
                                              <img src={form.employeeSignatureUrl} alt="sig" className="h-16 object-contain" />
                                           </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </Row>
                    </Section>

                    {/* Draft-only: approval route preview (no section header) */}
                    {!isReadOnly && (() => {
                        const empInitials = (user?.name || "Me").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                        const managerFromHeads = heads.find((h: any) => h.id === Number(autoFillData?.managerId || form.reportingManager));
                        const mgrName = managerFromHeads?.name || autoFillData?.managerName || "HOD";
                        const mgrInitials = mgrName !== "HOD" ? mgrName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "HOD";
                        return (
                            <ApprovalRoutePreview steps={[
                                { initials: empInitials, name: user?.name || "You", role: "Submitter", isSubmitter: true },
                                { initials: mgrInitials, name: mgrName, role: "Line Manager / HOD" },
                                { initials: "HR", name: "HR Department", role: "HR Review" },
                                { initials: "FIN", name: "Head of Finance", role: "Finance" },
                            ]} />
                        );
                    })()}

                    {/* 4. APPROVER SIGNATURES — only after resolution */}
                    {(requestData?.status === "approved" || requestData?.status === "rejected") && (
                    <Section title="4. APPROVER SIGNATURES">
                        {/* Approved/rejected: show actual signatures only */}
                        {(requestData?.status === "approved" || requestData?.status === "rejected") && (() => {
                            const hodApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "head_of_department");
                            const hodName = savedFormData.data?.managerSignerName || hodApproval?.approver?.name || "Line Manager / HOD";
                            const hodSig = savedFormData.data?.managerSignatureUrl || requestData?.managerSignatureUrl;

                            const hrApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "hr");
                            const hrName = savedFormData.data?.hrSignerName || hrApproval?.approver?.name || "HR Department";
                            const hrSig = savedFormData.data?.hrSignatureUrl || requestData?.hrSignatureUrl;

                            const finApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "head_of_finance");
                            const finName = savedFormData.data?.financeSignerName || finApproval?.approver?.name || "Head of Finance";
                            const finSig = savedFormData.data?.financeSignatureUrl || requestData?.financeSignatureUrl;

                            const ceoApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "ceo_md" || a.approvalLevel === "md");
                            const ceoName = savedFormData.data?.ceoSignerName || ceoApproval?.approver?.name || "CEO / MD";
                            const ceoSig = savedFormData.data?.ceoSignatureUrl || requestData?.ceoSignatureUrl;

                            const renderSlot = (label: string, name: string, sigUrl?: string, altText?: string) => sigUrl ? (
                                <Row label={label}>
                                    <div className="py-1">
                                        <img src={sigUrl} alt={altText || "Signature"} className="h-10 object-contain" />
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">✓ {name}</p>
                                    </div>
                                </Row>
                            ) : null;

                            return (
                                <>
                                    {renderSlot("4.1 HOD / Line Manager", hodName, hodSig, "HOD Signature")}
                                    {renderSlot("4.2 HR Review", hrName, hrSig, "HR Signature")}
                                    {renderSlot("4.3 Head of Finance", finName, finSig, "Finance Signature")}
                                    {ceoSig && renderSlot("4.4 CEO / MD", ceoName, ceoSig, "CEO Signature")}
                                </>
                            );
                        })()}
                    </Section>
                    )}


                    {/* 5. APPROVAL CHAIN (preview) */}
                    {(isReadOnly || requestData?.status === "pending" || requestData?.status === "approved" || requestData?.status === "rejected") && (
                        <Section title="5. APPROVAL CHAIN (preview)">
                            <div className="px-3 lg:px-4 py-3 lg:py-4">
                                <ApprovalChainPreview
                                    requestType="asset"
                                    currentApprovalLevel={requestData?.currentApprovalLevel}
                                    status={requestData?.status || "draft"}
                                    approvals={requestData?.approvals || []}
                                />
                            </div>
                        </Section>
                    )}
                </div>

                {/* ===== ACTIONS ===== */}
                {!isReadOnly && (
                    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center px-3 lg:px-6 py-3 lg:py-4 bg-gray-50 dark:bg-[#1a385c] gap-2 lg:gap-4 mt-6">
                        <div className="flex gap-2">
                            {/* Print/Download disabled until approved */}
                        </div>
                        <div className="flex flex-col lg:flex-row gap-2 w-full lg:justify-end">
                            <Button
                                variant="outline"
                                disabled={isSubmitting}
                                type="button"
                                onClick={() => handleSubmit(false)}
                                className="border-blue-400 dark:border-[#3b6dae]/50 h-9"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Draft
                            </Button>
                            <Button
                                disabled={isSubmitting}
                                type="button"
                                onClick={() => handleSubmit(true)}
                                className="bg-blue-600 hover:bg-blue-700 h-9 transition-colors font-bold"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit for Approval
                            </Button>
                        </div>
                    </div>
                )}

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

function Section({ title, children, className = "" }: { title: string, children: React.ReactNode, className?: string }) {
    return (
        <div className={className}>
            <div className="lg:bg-[#3b6dae] lg:text-white font-bold px-4 py-2 text-sm">{title}</div>
            {children}
        </div>
    );
}

function Row({ label, children, colSpan = false }: { label: React.ReactNode, children: React.ReactNode, colSpan?: boolean }) {
    return (
        <div className={`grid ${colSpan ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[220px_1fr]'} gap-0`}>
            {!colSpan && (
                <div className="px-2 lg:px-3 py-1.5 lg:py-2 font-medium lg:bg-blue-100 text-[#3b6dae] text-[10px] lg:text-xs flex items-center">
                    {label}
                </div>
            )}
            <div className="px-2 lg:px-3 py-1 flex items-center">{children}</div>
        </div>
    );
}
