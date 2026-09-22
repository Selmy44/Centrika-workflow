"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Package, Eye, Paperclip, ShieldCheck, XCircle, ShoppingBag, Calculator, Save, Lock, Sparkles, UserCheck } from "lucide-react";
import ApprovalChainPreview from "@/components/forms/ApprovalChainPreview";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { exportFormToPdf, getActiveFormElement, printFormElement } from "@/lib/formExport";

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

interface Props {
    requestData: any;
    onApprove: (data: {
        comments?: string;
        signatureFile?: File;
        escalateToCeo?: boolean;
        nextApproverId?: number;
        isFinalApproval?: boolean;
    }) => void;
    onReject: (reason: string) => void;
    isLoading?: boolean;
    onClose?: () => void;
    onBack?: () => void;
}

/**
 * AssetRequestApprovalView - Read-only approval view for asset requests.
 * Styled to match LeaveRequestForm and ExpenditureRequestForm design system.
 */
export default function AssetRequestApprovalView({ requestData, onApprove, onReject, isLoading = false, onClose, onBack }: Props) {
    const { user, hasRole } = useAuth();
    const [approvalComments, setApprovalComments] = useState("");
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [signaturePreview, setSignaturePreview] = useState("");
    const [signatureMethod, setSignatureMethod] = useState<"upload" | "draw">("draw");
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isPrintingForm, setIsPrintingForm] = useState(false);
    const [selectedNextApproverId, setSelectedNextApproverId] = useState<number | null>(null);
    const [financeMode, setFinanceMode] = useState<"final" | "escalate">("final");

    const { data: staffList = [] } = (trpc as any).users.listNextApprovers.useQuery();

    const isRequestApproved = requestData?.status === "approved";
    const isRequestRejected = requestData?.status === "rejected";
    const isRequestPending = requestData?.status === "pending";
    const approvalSectionIsReadOnly = !isRequestPending;

    // Check if the current user has already approved the CURRENT step of this request
    const userHasAlreadyApprovedCurrentLevel = Boolean(
        requestData?.approvals?.some((a: any) => 
            a.approverId === user?.id && 
            a.approvalLevel === requestData?.currentApprovalLevel && 
            a.status === "approved"
        )
    );

    // Find the pending approval record for the current active level
    const pendingApproval = requestData?.approvals?.find(
        (a: any) => a.status === "pending" && a.approvalLevel === requestData?.currentApprovalLevel
    ) || requestData?.approvals?.find((a: any) => a.status === "pending");

    // The user is the active approver ONLY if:
    // 1. Request is in "pending" status
    // 2. The user has NOT already approved the CURRENT level
    // 3. The user is explicitly assigned (pendingApproval.approverId === user.id) OR if not assigned by ID, holds the role for currentApprovalLevel
    const isCurrentApprover = Boolean(
        isRequestPending &&
        !userHasAlreadyApprovedCurrentLevel &&
        (
            (pendingApproval?.approverId && pendingApproval.approverId === user?.id) ||
            (!pendingApproval?.approverId && requestData?.currentApprovalLevel && (
                hasRole(requestData.currentApprovalLevel) || hasRole("admin") || hasRole("ceo_md")
            ))
        )
    );

    const { data, isLoading: detailsLoading } = trpc.requests.getAssetRequestDetails.useQuery(
        { requestId: requestData?.id || 0 },
        { enabled: !!requestData?.id, refetchInterval: 3000, refetchOnWindowFocus: true }
    );

    const { data: formDataDynamic } = trpc.requests.getAssetFormData.useQuery(
        { requestId: requestData?.id || 0 },
        { enabled: !!requestData?.id, refetchInterval: 3000, refetchOnWindowFocus: true }
    );

    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const storeFormData = trpc.requests.storeAssetFormData.useMutation();
    const saveSignatureToProfile = (trpc as any).auth.saveSignature.useMutation();

    // Pre-populate approver's draft comment, signature, and selections
    const hasPrepopulatedDraft = useRef(false);
    useEffect(() => {
        if (formDataDynamic && isCurrentApprover && !hasPrepopulatedDraft.current) {
            hasPrepopulatedDraft.current = true;
            const level = requestData?.currentApprovalLevel;
            let savedComment = "";
            let savedSig = "";
            let savedNextApprover: number | null = null;
            let savedMode: "final" | "escalate" = "final";

            if (level === "head_of_department") {
                savedComment = formDataDynamic.draftHODComment || formDataDynamic.hodComment || "";
                savedSig = formDataDynamic.draftHODSignatureUrl || formDataDynamic.managerSignatureUrl || "";
                savedNextApprover = formDataDynamic.draftHODNextApproverId || null;
            } else if (level === "head_of_finance") {
                savedComment = formDataDynamic.draftFinanceComment || formDataDynamic.financeComment || "";
                savedSig = formDataDynamic.draftFinanceSignatureUrl || formDataDynamic.financeSignatureUrl || "";
                savedNextApprover = formDataDynamic.draftFinanceNextApproverId || null;
                savedMode = formDataDynamic.draftFinanceMode || "final";
            } else if (level === "md" || level === "ceo_md") {
                savedComment = formDataDynamic.draftCeoComment || formDataDynamic.ceoComment || "";
                savedSig = formDataDynamic.draftCeoSignatureUrl || formDataDynamic.ceoSignatureUrl || "";
            }

            if (savedComment) setApprovalComments(savedComment);
            if (savedSig) {
                setSignaturePreview(savedSig);
                const file = base64ToFile(savedSig, "saved_signature.png");
                if (file) setSignatureFile(file);
            }
            if (savedNextApprover) setSelectedNextApproverId(savedNextApprover);
            if (savedMode) setFinanceMode(savedMode);
        }
    }, [formDataDynamic, isCurrentApprover, requestData?.currentApprovalLevel]);

    const handleSaveApproverDraft = async () => {
        setIsSavingDraft(true);
        try {
            let signatureDataUrl = signaturePreview;
            if (signatureFile && !signatureDataUrl.startsWith("data:")) {
                await new Promise<void>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        signatureDataUrl = ev.target?.result as string;
                        resolve();
                    };
                    reader.onerror = () => reject(new Error("Failed to read signature"));
                    reader.readAsDataURL(signatureFile);
                });
            }

            const currentFormData = formDataDynamic || {};
            const level = requestData?.currentApprovalLevel;
            const draftUpdates: any = {};

            if (level === "head_of_department") {
                draftUpdates.draftHODComment = approvalComments;
                draftUpdates.draftHODSignatureUrl = signatureDataUrl;
                draftUpdates.draftHODNextApproverId = selectedNextApproverId;
                if (signatureDataUrl) {
                    draftUpdates.managerSignatureUrl = signatureDataUrl;
                    draftUpdates.managerSignerName = user?.name || "Checked by";
                    draftUpdates.checkedByName = user?.name || "Checked by";
                }
            } else if (level === "head_of_finance") {
                draftUpdates.draftFinanceComment = approvalComments;
                draftUpdates.draftFinanceSignatureUrl = signatureDataUrl;
                draftUpdates.draftFinanceNextApproverId = selectedNextApproverId;
                draftUpdates.draftFinanceMode = financeMode;
                if (signatureDataUrl) {
                    draftUpdates.financeSignatureUrl = signatureDataUrl;
                    draftUpdates.financeSignerName = user?.name || "Reviewed by";
                    draftUpdates.reviewedByName = user?.name || "Reviewed by";
                }
            } else if (level === "md" || level === "ceo_md") {
                draftUpdates.draftCeoComment = approvalComments;
                draftUpdates.draftCeoSignatureUrl = signatureDataUrl;
                if (signatureDataUrl) {
                    draftUpdates.ceoSignatureUrl = signatureDataUrl;
                    draftUpdates.ceoSignerName = user?.name || "Approved by (CEO / MD)";
                    draftUpdates.approvedByName = user?.name || "Approved by (CEO / MD)";
                }
            }

            await storeFormData.mutateAsync({
                requestId: requestData.id,
                formData: {
                    ...currentFormData,
                    ...draftUpdates,
                }
            });

            toast.success("Draft saved successfully. You can return and approve later.");
        } catch (err: any) {
            console.error("Failed to save draft:", err);
            toast.error("Failed to save draft. Please try again.");
        } finally {
            setIsSavingDraft(false);
        }
    };

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSignatureFile(file);
            setSignaturePreview(URL.createObjectURL(file));
        }
    };

    const getApprovalLevelLabel = () => {
        switch (requestData?.currentApprovalLevel) {
            case "head_of_department": return "Department Head Approval";
            case "hr": return "HR Approval";
            case "head_of_finance": return "Finance Head Approval";
            case "md":
            case "ceo_md": return "MD/CEO Final Approval";
            default: return "Approval Stage";
        }
    };

    if (detailsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-slate-400">Loading asset request details...</p>
                </div>
            </div>
        );
    }

    const asset = data?.assetDetails as any;
    const employee = data?.employee as any;

    const items = (formDataDynamic?.items && Array.isArray(formDataDynamic.items) && formDataDynamic.items.length > 0)
        ? formDataDynamic.items
        : (asset?.itemName ? [{ id: "1", description: asset.itemName, category: asset.category || "it_equipment", quantity: 1, unitPrice: asset.estimatedCost || 0, subtotal: Number(asset.estimatedCost || 0) }] : []);

    const currency = formDataDynamic?.currency || asset?.currency || "RWF";
    const totalAmount = formDataDynamic?.estimatedCost
        ? String(formDataDynamic.estimatedCost)
        : (items.length > 0 ? (items.reduce((s: number, i: any) => s + (i.subtotal || 0), 0)).toLocaleString() : (asset?.estimatedCost ? Number(asset.estimatedCost).toLocaleString() : "0"));
    const title = formDataDynamic?.title || requestData?.title || `Asset Request: ${asset?.itemName || ""}`;
    const description = formDataDynamic?.description || asset?.description || requestData?.description || "";
    const employeeName = formDataDynamic?.employeeName || employee?.name || requestData?.user?.name || "N/A";
    const departmentName = formDataDynamic?.department || employee?.department?.name || employee?.department || "N/A";

    const formatAmount = (amount: number | null | undefined, cur: string | null | undefined) => {
        if (!amount) return "N/A";
        return `${cur || "RWF"} ${amount.toLocaleString()}`;
    };

    const handlePrint = () => {
        const formElement = getActiveFormElement();
        if (!formElement) {
            toast.error("Form content not found for printing");
            return;
        }
        try {
            setIsPrintingForm(true);
            printFormElement({ element: formElement, title: `Asset Request #${requestData?.id || ""}` });
        } catch {
            toast.error("Unable to open print view");
        } finally {
            setIsPrintingForm(false);
        }
    };

    const handleDownloadPdf = async () => {
        const formElement = getActiveFormElement();
        if (!formElement) {
            toast.error("Form content not found for export");
            return;
        }
        try {
            setIsExportingPdf(true);
            await exportFormToPdf({
                element: formElement,
                fileName: `asset-request-${requestData?.id || Date.now()}.pdf`,
            });
            toast.success("PDF downloaded successfully");
        } catch {
            toast.error("Failed to generate PDF");
        } finally {
            setIsExportingPdf(false);
        }
    };

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
                        <div className="flex flex-col gap-1.5 items-start text-blue-600">
                            <div className="flex items-center gap-2 min-w-0">
                                <Phone size={13} className="shrink-0" />
                                <span className="font-semibold truncate text-[11px]">+250 788 123 099</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <Mail size={13} className="shrink-0" />
                                <span className="font-semibold truncate text-[11px]">info@centrika.rw</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <Globe size={13} className="shrink-0" />
                                <span className="font-semibold truncate text-[11px]">www.centrika.rw</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={13} className="shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-[10px] leading-tight">Room F002, 2nd Floor, CHIC Building,</span>
                                    <span className="font-semibold text-[10px] leading-tight">Plot 1007, KN2 Kigali-Rwanda</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== TITLE BAR (YELLOW) ===== */}
                <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide shadow-sm uppercase">
                    ASSET REQUISITION FORM
                </div>

                {/* ===== REJECTION STATUS ALERT ===== */}
                {isRequestRejected && (
                    <div className="bg-red-50 border-l-4 border-red-500 px-4 py-4 my-6 rounded-r">
                        <div className="flex items-start gap-3">
                            <div className="text-red-600 mt-0.5">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-800 mb-1">Request Rejected</h3>
                                <p className="text-sm text-red-700">This request has been rejected and is now read-only.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== REQUEST HEADER SECTION (hidden — kept for future use) =====
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 lg:gap-3 px-3 lg:px-6 py-2 lg:py-3 text-xs lg:text-sm items-end">
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-xs uppercase">Department</p>
                        <div className="flex gap-0 items-center">
                            <span className="text-blue-600 font-bold text-xs whitespace-nowrap">CTK - </span>
                            <Input value={employee?.department || "N/A"} className="w-full h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed border-l-0" disabled />
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-xs uppercase">Date Submitted</p>
                        <Input type="text" value={requestData?.createdAt ? new Date(requestData.createdAt).toLocaleDateString() : "N/A"} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1 uppercase">Staff ID</p>
                        <Input value={employee?.staffId || "N/A"} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1 uppercase">Employee Name</p>
                        <Input value={employee?.name || "N/A"} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
                    </div>
                </div>
                ===== */}

                {/* ===== REQUEST DETAILS ===== */}
                <div className="border-t border-[#3b6dae]">
                    <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm flex items-center gap-2">
                        <Package size={16} /> REQUEST DETAILS
                    </div>

                    {/* 1. EMPLOYEE INFORMATION */}
                    <Section title="1. EMPLOYEE INFORMATION">
                        <Row label="1.1 Request Number">
                            <Input value={`AR-${requestData?.id || ''}`} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.2 Employee Full Name">
                            <Input value={employeeName} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.3 Department">
                            <Input value={departmentName} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                    </Section>

                    {/* 2. ASSET DETAILS */}
                    <Section title="2. ASSET / PROPERTY DETAILS">
                        <Row label="2.1 Request Title">
                            <Input
                                value={title}
                                disabled
                                className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium"
                            />
                        </Row>

                        <Row label="2.2 Items / Assets Breakdown" colSpan>
                            <div className="w-full my-2 space-y-3">
                                {/* Live Summary Bar */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1a385c] dark:to-[#224775] border border-blue-200 dark:border-[#3b6dae]/40 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-[#3b6dae] dark:text-blue-300">
                                        <ShoppingBag size={16} />
                                        <span>Itemized Assets & Property Breakdown</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs bg-white dark:bg-[#1f426b] px-2.5 py-1 rounded-full border border-blue-200 dark:border-[#3b6dae]/30 font-medium text-gray-700 dark:text-slate-200">
                                            {items.length} {items.length === 1 ? 'Item' : 'Items'}
                                        </span>
                                        <div className="flex items-center gap-1.5 bg-[#3b6dae] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                            <Calculator size={13} />
                                            <span>Total: {currency} {(items.reduce((s: number, i: any) => s + (i.subtotal || 0), 0)).toLocaleString()}</span>
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
                                                <th className="p-2.5 w-36">Asset Category</th>
                                                <th className="p-2.5 w-20 text-center">Qty</th>
                                                <th className="p-2.5 w-36">Unit Price ({currency})</th>
                                                <th className="p-2.5 w-36 text-right">Subtotal ({currency})</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-[#3b6dae]/20 bg-white dark:bg-[#1f426b]">
                                            {items.map((item: any, idx: number) => {
                                                const categoryLabels: Record<string, string> = {
                                                    it_equipment: "IT Equipment",
                                                    furniture: "Furniture",
                                                    office_supplies: "Office Supplies",
                                                    electronics: "Electronics",
                                                    other: "Other"
                                                };
                                                const catLabel = categoryLabels[item.category] || item.category || "IT Equipment";
                                                return (
                                                    <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/40 transition-colors">
                                                        <td className="p-2.5 text-center font-medium text-gray-500 dark:text-slate-400">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="p-2">
                                                            <Input
                                                                value={item.description || ""}
                                                                disabled
                                                                className="h-7 text-xs border-blue-200 dark:border-[#3b6dae]/30 bg-gray-50 dark:bg-[#295482]/50 !text-black dark:!text-slate-100 font-medium"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="h-7 border border-blue-200 dark:border-[#3b6dae]/30 rounded-md bg-gray-50 dark:bg-[#295482]/50 px-2.5 flex items-center text-xs !text-black dark:!text-slate-100 font-medium">
                                                                {catLabel}
                                                            </div>
                                                        </td>
                                                        <td className="p-2">
                                                            <Input
                                                                value={item.quantity || 1}
                                                                disabled
                                                                className="h-7 text-xs text-center border-blue-200 dark:border-[#3b6dae]/30 bg-gray-50 dark:bg-[#295482]/50 !text-black dark:!text-slate-100 font-medium"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <Input
                                                                value={Number(String(item.unitPrice || 0).replace(/,/g, "")).toLocaleString()}
                                                                disabled
                                                                className="h-7 text-xs border-blue-200 dark:border-[#3b6dae]/30 bg-gray-50 dark:bg-[#295482]/50 !text-black dark:!text-slate-100 font-medium"
                                                            />
                                                        </td>
                                                        <td className="p-2.5 text-right font-semibold text-blue-900 dark:text-blue-100">
                                                            {(item.subtotal || 0).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-blue-50 dark:bg-[#1a385c] font-bold border-t-2 border-blue-200 dark:border-[#3b6dae]/40">
                                            <tr>
                                                <td colSpan={5} className="p-2.5 text-right text-gray-700 dark:text-slate-200">
                                                    Grand Total Amount:
                                                </td>
                                                <td className="p-2.5 text-right text-sm text-[#3b6dae] dark:text-blue-300">
                                                    {currency} {(items.reduce((s: number, i: any) => s + (i.subtotal || 0), 0)).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </Row>

                        {/* 2.3 Total Amount & Currency */}
                        <Row label="2.3 Total Amount & Currency">
                            <div className="flex gap-2 items-center w-full">
                                <Input
                                    value={totalAmount}
                                    disabled
                                    className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium flex-1"
                                />
                                <div className="w-28 h-7 border border-blue-300 dark:border-[#3b6dae]/40 rounded-md bg-gray-100 dark:bg-[#295482] px-3 flex items-center justify-between text-xs text-gray-700 dark:text-slate-200 cursor-not-allowed font-medium">
                                    <span>{currency}</span>
                                    <span className="text-[10px] text-gray-400">▼</span>
                                </div>
                            </div>
                        </Row>

                        {/* 2.4 Purpose / Justification */}
                        <Row label="2.4 Purpose / Justification">
                            <Textarea
                                value={description}
                                disabled
                                className="min-h-20 border-blue-300 dark:border-[#3b6dae]/40 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100"
                            />
                        </Row>

                        {/* 2.5 Supporting doc - Hidden on print and PDF */}
                        <Row label="2.5 Supporting doc" className="no-print">
                            <div className="w-full space-y-2 py-1">
                                {(() => {
                                    const docs: Array<{ name: string; url: string }> = formDataDynamic?.supportingDocuments && Array.isArray(formDataDynamic.supportingDocuments) && formDataDynamic.supportingDocuments.length > 0
                                        ? formDataDynamic.supportingDocuments
                                        : (requestData?.attachments && Array.isArray(requestData.attachments) && requestData.attachments.length > 0
                                            ? requestData.attachments.filter((a: any) => a.type === "supporting_document").map((a: any) => ({ name: a.fileName, url: a.fileUrl }))
                                            : (formDataDynamic?.supportingDocumentUrl ? [{ name: "Supporting Document", url: formDataDynamic.supportingDocumentUrl }] : []));

                                    if (docs.length === 0) {
                                        return <p className="text-xs italic text-gray-500 py-1">No supporting documents attached</p>;
                                    }

                                    return (
                                        <div className="space-y-2 max-w-2xl">
                                            {docs.map((doc, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-blue-50/70 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-2.5">
                                                    <Paperclip size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                                    <span className="text-xs font-medium text-blue-900 dark:text-blue-100 flex-1 truncate">{doc.name}</span>
                                                    {doc.url && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => window.open(doc.url, "_blank")}
                                                            className="h-7 px-2.5 text-xs flex items-center gap-1 border-blue-200 hover:bg-blue-50"
                                                        >
                                                            <Eye size={12} />
                                                            View
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </Row>
                    </Section>

                    {/* 3. EMPLOYEE SIGNATURE */}
                    <Section title="3. EMPLOYEE SIGNATURE">
                        <div className="p-3 bg-white dark:bg-[#1f426b] flex flex-col items-start justify-start min-h-[75px]">
                            {formDataDynamic?.employeeSignatureUrl ? (
                                <>
                                    <img src={formDataDynamic.employeeSignatureUrl} alt="Employee Signature" className="h-12 max-h-12 object-contain" />
                                    <p className="text-[11px] text-gray-900 dark:text-slate-100 mt-1 font-semibold text-left">{employeeName}</p>
                                </>
                            ) : (
                                <p className="text-xs italic text-gray-400">No signature provided</p>
                            )}
                        </div>
                    </Section>

                    {/* 4. APPROVER SIGNATURES */}
                    <Section title="4. APPROVER SIGNATURES">
                        {/* Current active approval step */}
                        {!approvalSectionIsReadOnly && isCurrentApprover && (
                            <div className="border-b-2 border-blue-200 dark:border-[#3b6dae]/40 bg-blue-50/20 dark:bg-[#1a385c]/30">
                                {/* 1. Your Comment */}
                                <Row label="Your Comment">
                                    <div className="space-y-3 py-1 w-full">
                                        <Textarea
                                            placeholder="Add your comments or observations here..."
                                            value={approvalComments}
                                            onChange={(e) => setApprovalComments(e.target.value)}
                                            className="min-h-20 text-xs border-blue-300 dark:border-[#3b6dae]/40 bg-white dark:bg-[#1a385c]"
                                        />
                                    </div>
                                </Row>

                                {/* 2. Your Signature */}
                                <Row label="Your Signature">
                                    <FormSignatureSelector
                                        value={signaturePreview}
                                        initialFile={signatureFile}
                                        onChange={({ dataUrl, file, saveToProfile }) => {
                                            setSignaturePreview(dataUrl);
                                            setSignatureFile(file);
                                            if (saveToProfile && dataUrl) {
                                                saveSignatureToProfile.mutate({ signatureUrl: dataUrl });
                                            }
                                        }}
                                    />
                                </Row>

                                {/* 3. Routing & Next Approver Selection */}
                                {/* If at Checked by step: select Reviewed by person */}
                                {requestData?.currentApprovalLevel === "head_of_department" && (
                                    <Row label="Assign Reviewer (Reviewed by)">
                                        <div className="w-full space-y-2 py-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Select a reviewer or assign to yourself:</span>
                                                {user?.id && selectedNextApproverId !== user.id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedNextApproverId(user.id)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-all cursor-pointer shadow-xs"
                                                    >
                                                        <Sparkles size={11} className="text-amber-500" />
                                                        Assign to Myself
                                                    </button>
                                                )}
                                            </div>

                                            {selectedNextApproverId === user?.id && (
                                                <div className="flex items-center justify-between bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 rounded-lg px-3 py-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                                                            {user?.name?.slice(0, 2).toUpperCase() || "ME"}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-blue-950 dark:text-blue-100">Assigned to You (Self-Review)</span>
                                                            <span className="text-[10px] text-blue-700 dark:text-blue-300 block">You will review and approve this request at the "Reviewed by" stage.</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedNextApproverId(null)}
                                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 underline cursor-pointer"
                                                    >
                                                        Change
                                                    </button>
                                                </div>
                                            )}

                                            <Select
                                                value={selectedNextApproverId ? String(selectedNextApproverId) : ""}
                                                onValueChange={(val) => setSelectedNextApproverId(Number(val))}
                                            >
                                                <SelectTrigger className="w-full h-8 border-blue-300 dark:border-[#3b6dae]/40 text-xs bg-white dark:bg-[#1a385c]">
                                                    <SelectValue placeholder="Select staff member to review this request..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-60 bg-white dark:bg-[#1f426b] border-blue-200 dark:border-[#3b6dae]/30">
                                                    {staffList.map((staff: any) => {
                                                        const isSelf = staff.isSelf || staff.id === user?.id;
                                                        return (
                                                            <SelectItem
                                                                key={staff.id}
                                                                value={String(staff.id)}
                                                                className={`text-xs cursor-pointer ${isSelf ? "bg-blue-50/70 dark:bg-blue-950/40 font-semibold" : ""}`}
                                                            >
                                                                <div className="flex items-center justify-between w-full gap-2 py-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        {isSelf && <span className="text-amber-500">⭐</span>}
                                                                        <span className={`font-semibold ${isSelf ? "text-blue-900 dark:text-blue-200 font-bold" : "text-gray-900 dark:text-slate-100"}`}>
                                                                            {staff.name} {isSelf ? "(Myself)" : ""}
                                                                        </span>
                                                                        {staff.department && (
                                                                            <span className="text-[10px] text-blue-600 dark:text-blue-300 font-medium">({staff.department})</span>
                                                                        )}
                                                                        {staff.position && (
                                                                            <span className="text-[10px] text-gray-500 dark:text-slate-400">• {staff.position}</span>
                                                                        )}
                                                                    </div>
                                                                    {isSelf && (
                                                                        <span className="text-[9px] bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-2">
                                                                            Self
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </Row>
                                )}

                                {/* If at Reviewed by step: Option for Final Approval vs Escalating to CEO/MD */}
                                {requestData?.currentApprovalLevel === "head_of_finance" && (
                                    <>
                                        <Row label="Approval Mode">
                                            <div className="flex flex-wrap gap-2 py-1">
                                                <button
                                                    type="button"
                                                    onClick={() => { setFinanceMode("final"); setSelectedNextApproverId(null); }}
                                                    className={`px-4 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                                                        financeMode === "final"
                                                            ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                                                            : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d]"
                                                    }`}
                                                >
                                                    Final Approval (Complete Request)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFinanceMode("escalate")}
                                                    className={`px-4 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                                                        financeMode === "escalate"
                                                            ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                                                            : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d]"
                                                    }`}
                                                >
                                                    Select Final Approver (CEO / MD)
                                                </button>
                                            </div>
                                        </Row>
                                        {financeMode === "escalate" && (
                                            <Row label="Assign Final Approver">
                                                <div className="w-full space-y-2 py-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Select CEO/MD or assign to yourself:</span>
                                                        {user?.id && selectedNextApproverId !== user.id && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedNextApproverId(user.id)}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-all cursor-pointer shadow-xs"
                                                            >
                                                                <Sparkles size={11} className="text-amber-500" />
                                                                Assign to Myself
                                                            </button>
                                                        )}
                                                    </div>

                                                    {selectedNextApproverId === user?.id && (
                                                        <div className="flex items-center justify-between bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 rounded-lg px-3 py-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                                                                    {user?.name?.slice(0, 2).toUpperCase() || "ME"}
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-blue-950 dark:text-blue-100">Assigned to You (Self-Approval)</span>
                                                                    <span className="text-[10px] text-blue-700 dark:text-blue-300 block">You will give final approval to this request as CEO / MD.</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedNextApproverId(null)}
                                                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 underline cursor-pointer"
                                                            >
                                                                Change
                                                            </button>
                                                        </div>
                                                    )}

                                                    <Select
                                                        value={selectedNextApproverId ? String(selectedNextApproverId) : ""}
                                                        onValueChange={(val) => setSelectedNextApproverId(Number(val))}
                                                    >
                                                        <SelectTrigger className="w-full h-8 border-blue-300 dark:border-[#3b6dae]/40 text-xs bg-white dark:bg-[#1a385c]">
                                                            <SelectValue placeholder="Select Final Approver (CEO / MD)..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-60 bg-white dark:bg-[#1f426b] border-blue-200 dark:border-[#3b6dae]/30">
                                                            {staffList.map((staff: any) => {
                                                                const isSelf = staff.isSelf || staff.id === user?.id;
                                                                return (
                                                                    <SelectItem
                                                                        key={staff.id}
                                                                        value={String(staff.id)}
                                                                        className={`text-xs cursor-pointer ${isSelf ? "bg-blue-50/70 dark:bg-blue-950/40 font-semibold" : ""}`}
                                                                    >
                                                                        <div className="flex items-center justify-between w-full gap-2 py-0.5">
                                                                            <div className="flex items-center gap-2">
                                                                                {isSelf && <span className="text-amber-500">⭐</span>}
                                                                                <span className={`font-semibold ${isSelf ? "text-blue-900 dark:text-blue-200 font-bold" : "text-gray-900 dark:text-slate-100"}`}>
                                                                                    {staff.name} {isSelf ? "(Myself)" : ""}
                                                                                </span>
                                                                                {staff.department && (
                                                                                    <span className="text-[10px] text-blue-600 dark:text-blue-300 font-medium">({staff.department})</span>
                                                                                )}
                                                                                {staff.position && (
                                                                                    <span className="text-[10px] text-gray-500 dark:text-slate-400">• {staff.position}</span>
                                                                                )}
                                                                            </div>
                                                                            {isSelf && (
                                                                                <span className="text-[9px] bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-2">
                                                                                    Self
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </Row>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {(() => {
                            const selectedStaff = selectedNextApproverId ? staffList.find((s: any) => s.id === selectedNextApproverId) : null;

                            const isHOD = requestData?.currentApprovalLevel === "head_of_department";
                            const isFinance = requestData?.currentApprovalLevel === "head_of_finance";
                            const isCeo = requestData?.currentApprovalLevel === "ceo_md" || requestData?.currentApprovalLevel === "md";

                            const hodApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "head_of_department");
                            const hodSig = (isCurrentApprover && isHOD)
                                ? signaturePreview
                                : (formDataDynamic?.draftHODSignatureUrl || formDataDynamic?.managerSignatureUrl || hodApproval?.signature?.fileUrl || requestData?.managerSignatureUrl);
                            const hodName = formDataDynamic?.managerSignerName || formDataDynamic?.checkedByName || hodApproval?.approver?.name || requestData?.initialApprover?.name || (isHOD ? user?.name : "HOD");

                            const finApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "head_of_finance");
                            const finSig = (isCurrentApprover && isFinance)
                                ? signaturePreview
                                : (formDataDynamic?.draftFinanceSignatureUrl || formDataDynamic?.financeSignatureUrl || finApproval?.signature?.fileUrl || requestData?.financeSignatureUrl);
                            const finName = (isHOD && selectedStaff?.name)
                                ? selectedStaff.name
                                : (formDataDynamic?.financeSignerName || formDataDynamic?.reviewedByName || finApproval?.approver?.name || (isFinance ? user?.name : "Head of Finance"));

                            const ceoApproval = requestData?.approvals?.find((a: any) => a.approvalLevel === "ceo_md" || a.approvalLevel === "md");
                            const ceoSig = (isCurrentApprover && isCeo)
                                ? signaturePreview
                                : (formDataDynamic?.draftCeoSignatureUrl || formDataDynamic?.ceoSignatureUrl || ceoApproval?.signature?.fileUrl || requestData?.ceoSignatureUrl);
                            const ceoName = (isFinance && financeMode === "escalate" && selectedStaff?.name)
                                ? selectedStaff.name
                                : (formDataDynamic?.ceoSignerName || formDataDynamic?.approvedByName || ceoApproval?.approver?.name || (isCeo ? user?.name : "CEO / MD"));

                            const isCeoNotRequired = !ceoSig && (
                                isRequestApproved ||
                                requestData?.status === "approved" ||
                                (isFinance && isCurrentApprover && financeMode === "final")
                            );

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
                        })()}

                    </Section>

                    {/* 5. APPROVAL CHAIN (preview) - Hidden on print and PDF */}
                    <Section title="5. APPROVAL CHAIN (preview)" className="no-print">
                        <div className="px-3 lg:px-4 py-3 lg:py-4">
                            <ApprovalChainPreview
                                requestType="asset"
                                currentApprovalLevel={requestData?.currentApprovalLevel}
                                status={requestData?.status || "draft"}
                                approvals={requestData?.approvals || []}
                            />
                        </div>
                    </Section>
                </div>

                {/* ===== ACTIONS ===== */}
                {isRequestApproved && (
                    <div className="no-print flex flex-col lg:flex-row gap-2 px-3 md:px-6 py-4 md:py-5 bg-gray-50 dark:bg-[#1a385c] mb-4 lg:justify-end">
                        <Button
                            variant="outline"
                            disabled={isLoading || isPrintingForm}
                            onClick={handlePrint}
                            className="border-blue-400 dark:border-[#3b6dae]/50 text-blue-600 h-9"
                        >
                            {(isLoading || isPrintingForm) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Printer size={16} className="mr-1" /> Print Form
                        </Button>
                        <Button
                            variant="outline"
                            disabled={isLoading || isExportingPdf}
                            onClick={handleDownloadPdf}
                            className="border-blue-400 dark:border-[#3b6dae]/50 text-blue-600 h-9"
                        >
                            {(isLoading || isExportingPdf) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Download size={16} className="mr-1" /> Download PDF
                        </Button>
                    </div>
                )}
                {!approvalSectionIsReadOnly && isCurrentApprover && (
                    <div className="no-print sticky bottom-0 z-50 flex flex-col sm:flex-row justify-between items-center gap-3 px-4 lg:px-6 py-3 bg-white dark:bg-[#1a385c] border-t-2 border-[#3b6dae]/20 shadow-[0_-2px_12px_rgba(59,109,174,0.08)] mt-4 rounded-b-lg">
                        <p className="text-xs text-gray-400 dark:text-slate-400 hidden sm:block">
                            <span className="font-semibold text-[#3b6dae] dark:text-blue-400">🛡️ Review:</span> Approve or reject this request
                        </p>
                        <div className="flex gap-3 w-full sm:w-auto justify-end">
                            <Button
                                variant="outline"
                                disabled={isLoading || isSavingDraft}
                                type="button"
                                onClick={handleSaveApproverDraft}
                                className="flex-1 sm:flex-none min-w-[120px] border-[#3b6dae]/40 text-[#3b6dae] dark:text-blue-300 dark:border-[#3b6dae]/40 hover:bg-blue-50 dark:hover:bg-[#1f426b] h-9 font-semibold text-xs"
                            >
                                {isSavingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {isSavingDraft ? "Saving..." : "Save Draft"}
                            </Button>
                            <Button
                                variant="outline"
                                disabled={isLoading || isSavingDraft}
                                onClick={() => setShowRejectDialog(true)}
                                className="flex-1 sm:flex-none min-w-[120px] border-red-300 text-red-600 dark:text-red-400 dark:border-red-400/40 hover:bg-red-50 dark:hover:bg-red-950/40 h-9 font-semibold text-xs"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                            </Button>
                            {requestData?.currentApprovalLevel === "head_of_department" ? (
                                <Button
                                    disabled={isLoading || !signatureFile}
                                    onClick={() => {
                                        if (!selectedNextApproverId) { toast.error("Please select a staff member for Reviewed by"); return; }
                                        if (!approvalComments.trim()) { toast.error("Please add your comment before approving"); return; }
                                        if (!signatureFile) { toast.error("Please provide your signature before approving"); return; }
                                        onApprove({ comments: approvalComments, signatureFile, nextApproverId: selectedNextApproverId });
                                    }}
                                    className="flex-1 sm:flex-none min-w-[180px] bg-[#3b6dae] hover:bg-[#2d5a9e] text-white h-9 font-semibold text-xs transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                    Approve & Forward to Reviewer
                                </Button>
                            ) : requestData?.currentApprovalLevel === "head_of_finance" ? (
                                financeMode === "final" ? (
                                    <Button
                                        disabled={isLoading || !signatureFile}
                                        onClick={() => {
                                            if (!approvalComments.trim()) { toast.error("Please add your comment before approving"); return; }
                                            if (!signatureFile) { toast.error("Please provide your signature before approving"); return; }
                                            onApprove({ comments: approvalComments, signatureFile, isFinalApproval: true });
                                        }}
                                        className="flex-1 sm:flex-none min-w-[150px] bg-[#3b6dae] hover:bg-[#2d5a9e] text-white h-9 font-semibold text-xs transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                        Approve Request (Final)
                                    </Button>
                                ) : (
                                    <Button
                                        disabled={isLoading || !signatureFile}
                                        onClick={() => {
                                            if (!selectedNextApproverId) { toast.error("Please select the final approver (CEO / MD)"); return; }
                                            if (!approvalComments.trim()) { toast.error("Please add your comment before approving"); return; }
                                            if (!signatureFile) { toast.error("Please provide your signature before approving"); return; }
                                            onApprove({ comments: approvalComments, signatureFile, nextApproverId: selectedNextApproverId, escalateToCeo: true });
                                        }}
                                        className="flex-1 sm:flex-none min-w-[190px] bg-[#3b6dae] hover:bg-[#2d5a9e] text-white h-9 font-semibold text-xs transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                        Approve & Forward to CEO/MD
                                    </Button>
                                )
                            ) : (
                                <Button
                                    disabled={isLoading || !signatureFile}
                                    onClick={() => {
                                        if (!approvalComments.trim()) { toast.error("Please add your comment before approving"); return; }
                                        if (!signatureFile) { toast.error("Please provide your signature before approving"); return; }
                                        onApprove({ comments: approvalComments, signatureFile, isFinalApproval: true });
                                    }}
                                    className="flex-1 sm:flex-none min-w-[140px] bg-[#3b6dae] hover:bg-[#2d5a9e] text-white h-9 font-semibold text-xs transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                    Approve & Sign
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== REJECT DIALOG ===== */}
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-red-600">Reject Asset Request</DialogTitle>
                            <DialogDescription className="text-sm text-gray-600 mt-2">
                                Please provide a detailed reason for rejecting this asset request. This feedback will be shared with the requester.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Rejection Reason *</label>
                                <Textarea
                                    placeholder="Provide a reason for rejection..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="min-h-24 text-sm border-red-300 focus:border-red-500 focus:ring-red-500"
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-500 mt-1">{rejectReason.length}/500 characters</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setShowRejectDialog(false);
                                    setRejectReason("");
                                }}
                                className="w-full sm:w-auto border-gray-300"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={rejectReason.trim().length < 1 || isLoading}
                                onClick={() => {
                                    if (rejectReason.trim().length >= 1) {
                                        onReject(rejectReason);
                                        setRejectReason("");
                                        setShowRejectDialog(false);
                                    }
                                }}
                                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Reject Request
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <div className="bg-[#3b6dae] text-white font-bold px-4 py-1.5 text-xs tracking-wide">{title}</div>
            {children}
        </div>
    );
}

function Row({ label, children, colSpan = false, className = "" }: { label: React.ReactNode; children: React.ReactNode; colSpan?: boolean; className?: string }) {
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
