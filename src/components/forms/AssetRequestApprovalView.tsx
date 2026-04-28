"use client";

import React, { useState } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Package, Eye } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad } from "@/components/SignaturePad";
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
    onApprove: (data: { comments?: string; signatureFile?: File; escalateToCeo?: boolean }) => void;
    onReject: (reason: string) => void;
    isLoading?: boolean;
    onClose?: () => void;
    onBack?: () => void;
}

/**
 * AssetRequestApprovalView - Read-only approval view for asset requests.
 * Styled to match LeaveRequestForm design system.
 */
export default function AssetRequestApprovalView({ requestData, onApprove, onReject, isLoading = false, onClose, onBack }: Props) {
    const { user } = useAuth();
    const [approvalComments, setApprovalComments] = useState("");
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [signaturePreview, setSignaturePreview] = useState("");
    const [signatureMethod, setSignatureMethod] = useState<"upload" | "draw">("draw");
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isPrintingForm, setIsPrintingForm] = useState(false);

    const isRequestApproved = requestData?.status === "approved";
    const isRequestRejected = requestData?.status === "rejected";
    const approvalSectionIsReadOnly = isRequestApproved || isRequestRejected;

    const { data, isLoading: detailsLoading } = trpc.requests.getAssetRequestDetails.useQuery(
        { requestId: requestData?.id || 0 },
        { enabled: !!requestData?.id }
    );

    const { data: formDataDynamic } = trpc.requests.getAssetFormData.useQuery(
        { requestId: requestData?.id || 0 },
        { enabled: !!requestData?.id }
    );

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

    const formatAmount = (amount: number | null | undefined, currency: string | null | undefined) => {
        if (!amount) return "N/A";
        return `${currency || "RWF"} ${amount.toLocaleString()}`;
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
        <div className="w-full bg-white dark:bg-[#1f426b] text-black dark:text-slate-100 px-3 md:px-10 leave-form-container relative dark:border-[#2b6cb0]/30">

            {/* CLOSE/BACK BUTTON */}
            <button
                onClick={() => onBack ? onBack() : (onClose ? onClose() : window.history.back())}
                className="no-print absolute top-4 right-4 p-2 hover:bg-gray-100 dark:bg-[#295482] rounded-lg transition"
                title="Close form"
            >
                <svg className="w-6 h-6 text-gray-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div>
                {/* ===== HEADER WITH LOGO AND CONTACT INFO ===== */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start px-3 md:px-8 py-4 md:py-6 gap-4 md:gap-12">
                    <div className="shrink-0">
                        <img
                            src="/logo/centrikaLogo.png"
                            alt="Centrika Logo"
                            className="h-14 md:h-32 w-auto"
                        />
                    </div>
                    <div className="text-xs md:text-sm flex-1 flex justify-start md:justify-end">
                        <div className="flex flex-col gap-2 md:gap-3 items-start text-blue-600">
                            <div className="flex items-center gap-2 min-w-0">
                                <Phone size={14} className="shrink-0 md:w-[16px] md:h-[16px]" />
                                <span className="font-semibold truncate text-[11px] md:text-sm">+250 788 123 099</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <Mail size={14} className="shrink-0 md:w-[16px] md:h-[16px]" />
                                <span className="font-semibold truncate text-[11px] md:text-sm">info@centrika.rw</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <Globe size={14} className="shrink-0 md:w-[16px] md:h-[16px]" />
                                <span className="font-semibold truncate text-[11px] md:text-sm">www.centrika.rw</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="shrink-0 mt-0.5 md:w-[16px] md:h-[16px]" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-[10px] md:text-sm leading-tight">Room F002, 2nd Floor, CHIC Building,</span>
                                    <span className="font-semibold text-[10px] md:text-sm leading-tight">Plot 1007, KN2 Kigali-Rwanda</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== TITLE BAR (YELLOW) ===== */}
                <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide shadow-sm uppercase">
                    Asset / Property Request — Approval View
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

                {/* ===== REQUEST HEADER SECTION ===== */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm items-end">
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-xs uppercase">Department</p>
                        <div className="flex gap-0 items-center">
                            <span className="text-blue-600 font-bold text-xs whitespace-nowrap">CTK - </span>
                            <Input
                                value={employee?.department || "N/A"}
                                className="w-full h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed border-l-0"
                                disabled
                            />
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-xs uppercase">Date Submitted</p>
                        <Input
                            type="text"
                            value={requestData?.createdAt ? new Date(requestData.createdAt).toLocaleDateString() : "N/A"}
                            className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
                            disabled
                        />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1 uppercase">Staff ID</p>
                        <Input
                            value={employee?.staffId || "N/A"}
                            className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
                            disabled
                        />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1 uppercase">Employee Name</p>
                        <Input
                            value={employee?.name || "N/A"}
                            className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
                            disabled
                        />
                    </div>
                </div>

                {/* ===== REQUEST DETAILS ===== */}
                <div className="border-t border-[#3b6dae]">
                    <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm flex items-center gap-2">
                        <Package size={16} /> ASSET REQUEST DETAILS: #{requestData?.id}
                    </div>

                    {/* 1. EMPLOYEE INFORMATION */}
                    <Section title="1. EMPLOYEE INFORMATION">
                        <Row label="1.1 Employee Full Name">
                            <Input value={employee?.name || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.2 Position / Title">
                            <Input value={employee?.position || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.3 Department">
                            <Input value={employee?.department || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                    </Section>

                    {/* 2. ASSET DETAILS */}
                    <Section title="2. ASSET / PROPERTY DETAILS">
                        <Row label="2.1 Item Name">
                            <Input value={asset?.itemName || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-semibold" />
                        </Row>
                        <Row label="2.2 Estimated Cost">
                            <Input value={formatAmount(asset?.estimatedCost, asset?.currency)} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-blue-700 font-bold" />
                        </Row>
                        <Row label="2.3 Category">
                            <Input value={asset?.category || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 uppercase" />
                        </Row>
                        <Row label="2.4 Purpose / Description">
                            <Textarea value={asset?.description || requestData?.description || "N/A"} disabled className="min-h-24 border-blue-300 dark:border-[#3b6dae]/40 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100" />
                        </Row>
                    </Section>

                    <Section title="3. SUPPORTING DOCUMENT">
                        <Row label="3.1 Attachment">
                            <div className="flex items-center gap-4">
                                {formDataDynamic?.supportingDocumentUrl ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-green-600 font-medium">Attached: Document</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(formDataDynamic.supportingDocumentUrl, "_blank")}
                                            className="h-8 px-3 text-xs flex items-center gap-1.5 border-blue-200 hover:bg-blue-50"
                                        >
                                            <Eye size={14} />
                                            View
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-xs italic text-gray-500 py-2">No supporting document attached</p>
                                )}
                            </div>
                        </Row>
                    </Section>

                    {/* 4. EMPLOYEE SIGNATURE */}
                    <Section title="4. EMPLOYEE SIGNATURE">
                        <Row label="4.1 Employee Signature">
                            <div className="mt-1 mb-2">
                                {formDataDynamic?.employeeSignatureUrl ? (
                                    <div className="p-2 border border-blue-200 dark:border-[#3b6dae]/30 rounded inline-block bg-white dark:bg-[#1f426b]">
                                        <img src={formDataDynamic.employeeSignatureUrl} alt="Employee Signature" className="h-12 object-contain" />
                                    </div>
                                ) : (
                                    <p className="text-xs italic text-gray-500 mt-2">No signature provided</p>
                                )}
                            </div>
                        </Row>
                    </Section>

                    {/* 5. APPROVAL WORKFLOW */}
                    <Section title="5. APPROVAL WORKFLOW">
                        {/* Always show previous approvals if they exist */}
                        {formDataDynamic?.managerSignatureUrl && (
                            <Row label="5.1 Line Manager / HOD">
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Approved by HOD:</p>
                                    <img src={formDataDynamic.managerSignatureUrl} alt="HOD Signature" className="h-10 object-contain border border-blue-200 dark:border-[#3b6dae]/30 rounded p-1 bg-white dark:bg-[#1f426b]" />
                                </div>
                            </Row>
                        )}
                        {formDataDynamic?.hrSignatureUrl && (
                            <Row label="5.2 HR Review">
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Approved by HR:</p>
                                    <img src={formDataDynamic.hrSignatureUrl} alt="HR Signature" className="h-10 object-contain border border-blue-200 dark:border-[#3b6dae]/30 rounded p-1 bg-white dark:bg-[#1f426b]" />
                                </div>
                            </Row>
                        )}
                        {formDataDynamic?.financeSignatureUrl && (
                            <Row label="5.3 Head of Finance">
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Approved by Head of Finance:</p>
                                    <img src={formDataDynamic.financeSignatureUrl} alt="Finance Signature" className="h-10 object-contain border border-blue-200 dark:border-[#3b6dae]/30 rounded p-1 bg-white dark:bg-[#1f426b]" />
                                </div>
                            </Row>
                        )}
                        {formDataDynamic?.ceoSignatureUrl && (
                            <Row label="5.4 CEO / MD">
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Final Approval by CEO/MD:</p>
                                    <img src={formDataDynamic.ceoSignatureUrl} alt="CEO Signature" className="h-10 object-contain border border-blue-200 dark:border-[#3b6dae]/30 rounded p-1 bg-white dark:bg-[#1f426b]" />
                                </div>
                            </Row>
                        )}

                        {!approvalSectionIsReadOnly ? (
                            <div className="p-4 bg-blue-50/50 mt-2">
                                <h3 className="text-sm font-bold text-blue-700 mb-3 text-center border-b border-blue-200 dark:border-[#3b6dae]/30 pb-2">
                                    Wait for Your Approval: {getApprovalLevelLabel().toUpperCase()}
                                </h3>
                                <Row label="Your Comments">
                                    <Textarea
                                        placeholder="Add your comments or observations..."
                                        value={approvalComments}
                                        onChange={(e) => setApprovalComments(e.target.value)}
                                        className="border-blue-300 dark:border-[#3b6dae]/40 min-h-20 text-xs"
                                    />
                                </Row>

                                {/* Signature Upload */}
                                <Row label="Your Signature">
                                    <div className="space-y-3">
                                        {!approvalSectionIsReadOnly && (
                                            <div className="flex gap-4 mb-4">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        checked={signatureMethod === "draw"}
                                                        onChange={() => {
                                                            setSignatureMethod("draw");
                                                            setSignatureFile(null);
                                                            setSignaturePreview("");
                                                        }}
                                                        className="w-4 h-4 accent-blue-600"
                                                    />
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Draw Signature</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        checked={signatureMethod === "upload"}
                                                        onChange={() => {
                                                            setSignatureMethod("upload");
                                                            setSignatureFile(null);
                                                            setSignaturePreview("");
                                                        }}
                                                        className="w-4 h-4 accent-blue-600"
                                                    />
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Upload Image</span>
                                                </label>
                                            </div>
                                        )}

                                        {signatureMethod === "upload" ? (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setSignatureFile(file);
                                                            const reader = new FileReader();
                                                            reader.onload = (ev) => setSignaturePreview(ev.target?.result as string);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    disabled={isLoading}
                                                    className="block w-full text-xs text-gray-600 dark:text-slate-400 border border-dashed border-blue-300 dark:border-[#3b6dae]/40 rounded p-2 cursor-pointer bg-blue-50/30"
                                                />
                                            </div>
                                        ) : (
                                            <SignaturePad 
                                                onSave={(dataUrl) => {
                                                    const file = base64ToFile(dataUrl, "approver_signature.png");
                                                    setSignatureFile(file);
                                                    setSignaturePreview(dataUrl);
                                                }}
                                                onClear={() => {
                                                    setSignatureFile(null);
                                                    setSignaturePreview("");
                                                }}
                                            />
                                        )}

                                        {signaturePreview && (
                                            <div className="space-y-2 animate-in zoom-in duration-300">
                                                <div className="p-2 border-2 border-dashed border-green-300 rounded bg-green-50 flex items-center gap-4">
                                                    <img src={signaturePreview} alt="approver-signature" className="h-12 object-contain" />
                                                    <p className="text-[10px] font-semibold text-green-700 uppercase">Signature Selected</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSignaturePreview("");
                                                        setSignatureFile(null);
                                                    }}
                                                    className="text-[10px] text-red-600 hover:text-red-800 font-bold uppercase underline underline-offset-2"
                                                >
                                                    Clear and Change
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </Row>
                            </div>
                        ) : (
                            <Row label="Status">
                                <div className={`px-4 py-2 rounded text-sm font-bold inline-block ${isRequestApproved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                    {isRequestApproved ? "✓ FULLY APPROVED" : "✗ REJECTED"}
                                </div>
                            </Row>
                        )}
                    </Section>
                </div>

                {/* ===== ACTIONS ===== */}
                {isRequestApproved && (
                    <div className="no-print flex flex-col sm:flex-row gap-2 px-3 md:px-6 py-4 md:py-5 border-t border-blue-400 dark:border-[#3b6dae]/50 bg-gray-50 dark:bg-[#1a385c] mb-4">
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
                {!approvalSectionIsReadOnly && (
                    <div className="no-print flex flex-col sm:flex-row gap-2 px-3 md:px-6 py-4 md:py-5 border-t border-blue-400 dark:border-[#3b6dae]/50 bg-gray-50 dark:bg-[#1a385c] mb-4">
                        <Button
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => setShowRejectDialog(true)}
                            className="border-red-400 text-red-600 hover:bg-red-50 h-9 font-bold tracking-tight"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            REJECT REQUEST
                        </Button>
                        <Button
                            disabled={isLoading}
                            onClick={() => onApprove({ comments: approvalComments, signatureFile: signatureFile || undefined })}
                            className="bg-green-600 hover:bg-green-700 h-9 font-bold px-8 tracking-tight transition-all"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            APPROVE {signatureFile ? "& SIGN" : "REQUEST"}
                        </Button>
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
                                    placeholder="Provide a clear and professional reason for rejection (minimum 10 characters)..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="min-h-24 text-sm border-red-300 focus:border-red-500 focus:ring-red-500"
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-500 mt-1">{rejectReason.length}/500 characters</p>
                            </div>
                        </div>
                        <DialogFooter className="flex gap-2 justify-end">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setShowRejectDialog(false);
                                    setRejectReason("");
                                }}
                                className="border-gray-300"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={rejectReason.trim().length < 10 || isLoading}
                                onClick={() => {
                                    if (rejectReason.trim().length >= 10) {
                                        onReject(rejectReason);
                                        setRejectReason("");
                                        setShowRejectDialog(false);
                                    }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border-t border-[#3b6dae]">
            <div className="bg-[#3b6dae] text-white font-bold px-4 py-1.5 text-xs uppercase tracking-wider">{title}</div>
            {children}
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] border-b border-[#3b6dae] items-stretch gap-0">
            <div className="px-2 md:px-3 py-1.5 md:py-2 font-semibold md:border-r border-[#3b6dae] bg-blue-50/50 text-[#3b6dae] text-[10px] md:text-[11px] flex items-center">
                {label}
            </div>
            <div className="px-2 md:px-3 py-1.5 flex items-center">{children}</div>
        </div>
    );
}
