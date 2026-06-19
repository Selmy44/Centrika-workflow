"use client";

import React, { useState } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Eye, Paperclip } from "lucide-react";
import ApprovalChainPreview from "@/components/forms/ApprovalChainPreview";
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
 * ExpenditureRequestApprovalView - Read-only approval view for expenditure requests.
 * Styled to match LeaveRequestForm design system.
 */
export default function ExpenditureRequestApprovalView({ requestData, onApprove, onReject, isLoading = false, onClose, onBack }: Props) {
    const { user, hasRole } = useAuth();
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
    const isCurrentApprover = requestData?.currentApprovalLevel ? hasRole(requestData.currentApprovalLevel) : false;

    const { data, isLoading: detailsLoading } = trpc.requests.getExpenditureRequestDetails.useQuery(
        { requestId: requestData?.id || 0 },
        { enabled: !!requestData?.id }
    );

    const { data: formDataDynamic } = trpc.requests.getExpenditureFormData.useQuery(
        { requestId: requestData?.id || 0 },
        {
            enabled: !!requestData?.id,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        }
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
            case "ceo_md": return "CEO/MD Final Approval";
            default: return "Approval";
        }
    };

    if (detailsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-slate-400">Loading expenditure request details...</p>
                </div>
            </div>
        );
    }

    const exp = data?.expenditureDetails as any;
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
            printFormElement({ element: formElement, title: `Expenditure Request #${requestData?.id || ""}` });
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
                fileName: `expenditure-request-${requestData?.id || Date.now()}.pdf`,
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
                <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide">
                    EXPENDITURE REQUEST FORM — APPROVAL
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
                                <p className="text-sm text-red-700">This expenditure request has been rejected and is now read-only.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== REQUEST HEADER SECTION (hidden — kept for future use) =====
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 lg:gap-3 px-3 lg:px-6 py-2 lg:py-3 text-xs lg:text-sm items-end">
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-xs">Department</p>
                        <div className="flex gap-0 items-center">
                            <span className="text-blue-600 font-bold text-xs whitespace-nowrap">CTK - </span>
                            <Input value={employee?.department || exp?.department || "N/A"} className="w-full h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed border-l-0" disabled />
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-xs">Date Submitted</p>
                        <Input type="text" value={requestData?.createdAt ? new Date(requestData.createdAt).toLocaleDateString() : "N/A"} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1">Staff ID</p>
                        <Input value={employee?.staffId || "N/A"} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1">Employee Name</p>
                        <Input value={employee?.name || "N/A"} className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed" disabled />
                    </div>
                </div>
                ===== */}

                {/* ===== REQUEST DETAILS ===== */}
                <div className="border-t border-[#3b6dae]">
                    <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>

                    {/* 1. EMPLOYEE INFORMATION */}
                    <Section title="1. EMPLOYEE INFORMATION">
                        <Row label="1.1 Request Number">
                            <Input value={`ER-${requestData?.id || ''}`} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.2 Employee Full Name">
                            <Input value={employee?.name || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.3 Department">
                            <Input value={employee?.department || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.4 Employee / Staff ID">
                            <Input value={employee?.staffId || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.5 Position / Title">
                            <Input value={employee?.position || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.6 Date of Employment">
                            <Input value={employee?.dateOfEmployment || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.7 Work Email">
                            <Input value={employee?.email || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                    </Section>

                    {/* 2. EXPENDITURE DETAILS */}
                    <Section title="2. EXPENDITURE DETAILS">
                        <Row label="2.1 Request ID">
                            <Input value={`#${requestData?.id}`} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="2.2 Type of Expenditure">
                            <Input value={exp?.category || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="2.3 Amount">
                            <div className="flex gap-2 items-center">
                                <Input value={formatAmount(exp?.amount, exp?.currency)} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                            </div>
                        </Row>
                        <Row label="2.4 Currency">
                            <Input value={exp?.currency || "RWF"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="2.5 Department">
                            <Input value={exp?.department || employee?.department || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        {requestData?.description && (
                            <Row label="2.6 Purpose / Justification">
                                <Textarea value={requestData.description} disabled className="min-h-20 border-blue-300 dark:border-[#3b6dae]/40 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100" />
                            </Row>
                        )}
                        {requestData?.title && (
                            <Row label="2.7 Request Title">
                                <Input value={requestData.title} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                            </Row>
                        )}
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

                    <Section title="4. EMPLOYEE SIGNATURE">
                        <Row label="4.1 Employee Signature">
                            <div className="mt-1 mb-2">
                                {formDataDynamic?.employeeSignatureUrl ? (
                                    <div className="py-1">
                                        <img src={formDataDynamic.employeeSignatureUrl} alt="Employee Signature" className="h-12 object-contain" />
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{requestData?.user?.name || "Employee"}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs italic text-gray-500 mt-2">No signature provided</p>
                                )}
                            </div>
                        </Row>
                    </Section>

                    {/* 5. APPROVER SIGNATURES */}
                    <Section title="5. APPROVER SIGNATURES">
                        {formDataDynamic?.managerSignatureUrl && (
                            <Row label="5.1 Line Manager / HOD">
                                <div className="mt-2">
                                    <img src={formDataDynamic.managerSignatureUrl} alt="HOD Signature" className="h-10 object-contain" />
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">✓ {formDataDynamic?.managerSignerName || requestData?.approvals?.find((a: any) => a.approvalLevel === "head_of_department")?.approver?.name || ""}</p>
                                </div>
                            </Row>
                        )}
                        {formDataDynamic?.hrSignatureUrl && (
                            <Row label="5.2 HR Review">
                                <div className="mt-2">
                                    <img src={formDataDynamic.hrSignatureUrl} alt="HR Signature" className="h-10 object-contain" />
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">✓ {formDataDynamic?.hrSignerName || requestData?.approvals?.find((a: any) => a.approvalLevel === "hr")?.approver?.name || ""}</p>
                                </div>
                            </Row>
                        )}
                        {formDataDynamic?.financeSignatureUrl && (
                            <Row label="5.3 Head of Finance">
                                <div className="mt-2">
                                    <img src={formDataDynamic.financeSignatureUrl} alt="Finance Signature" className="h-10 object-contain" />
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">✓ {formDataDynamic?.financeSignerName || requestData?.approvals?.find((a: any) => a.approvalLevel === "head_of_finance")?.approver?.name || ""}</p>
                                </div>
                            </Row>
                        )}
                        {formDataDynamic?.ceoSignatureUrl && (
                            <Row label="5.4 CEO / MD">
                                <div className="mt-2">
                                    <img src={formDataDynamic.ceoSignatureUrl} alt="CEO Signature" className="h-10 object-contain" />
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">✓ {formDataDynamic?.ceoSignerName || requestData?.approvals?.find((a: any) => a.approvalLevel === "ceo_md" || a.approvalLevel === "md")?.approver?.name || ""}</p>
                                </div>
                            </Row>
                        )}

                        {/* Current active approval step */}
                        {!approvalSectionIsReadOnly && isCurrentApprover && (
                            <div className="border-t border-blue-200 dark:border-[#3b6dae]/40">
                                <Row label="5.5 Your Comment">
                                    <div className="space-y-3 py-1 w-full">
                                        <Textarea
                                            placeholder="Add your comments or observations here..."
                                            value={approvalComments}
                                            onChange={(e) => setApprovalComments(e.target.value)}
                                            className="min-h-20 text-xs border-blue-300 dark:border-[#3b6dae]/40 bg-white dark:bg-[#1a385c]"
                                        />
                                    </div>
                                </Row>
                                <Row label="5.6 Your Signature">
                                    <div className="space-y-3 py-1 w-full">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { setSignatureMethod("draw"); setSignatureFile(null); setSignaturePreview(""); }}
                                                className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                                                    signatureMethod === "draw"
                                                        ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                                                        : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"
                                                } cursor-pointer`}
                                            >
                                                Draw
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setSignatureMethod("upload"); setSignatureFile(null); setSignaturePreview(""); }}
                                                className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                                                    signatureMethod === "upload"
                                                        ? "bg-[#2d3a6d] text-white border-[#2d3a6d] shadow-sm"
                                                        : "bg-white dark:bg-[#1f426b] text-gray-600 dark:text-slate-300 border-gray-300 dark:border-[#3b6dae]/40 hover:border-[#2d3a6d] hover:text-[#2d3a6d]"
                                                } cursor-pointer`}
                                            >
                                                Upload image
                                            </button>
                                        </div>

                                        {signatureMethod === "upload" ? (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                {signaturePreview ? (
                                                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-[#1a385c] rounded-lg border border-blue-200 dark:border-[#3b6dae]/30 p-3">
                                                        <Paperclip size={14} className="text-blue-600 shrink-0" />
                                                        <span className="text-xs font-medium text-blue-800 dark:text-blue-200 flex-1 truncate">{signatureFile?.name || "Signature image"}</span>
                                                        <button type="button" onClick={() => { setSignatureFile(null); setSignaturePreview(""); }} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-[#3b6dae]/50 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1a385c]/50 transition-all duration-200 w-fit">
                                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+ Upload signature image</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setSignatureFile(file);
                                                                const reader = new FileReader();
                                                                reader.onload = (ev) => setSignaturePreview(ev.target?.result as string);
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }} />
                                                    </label>
                                                )}
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

                                        {signaturePreview && signatureMethod === "upload" && (
                                            <div className="mt-2 animate-in zoom-in duration-300">
                                                <img src={signaturePreview} alt="approver-signature" className="h-12 object-contain" />
                                            </div>
                                        )}
                                    </div>
                                </Row>
                            </div>
                        )}

                    </Section>

                    {/* 6. APPROVAL CHAIN (preview) */}
                    <Section title="6. APPROVAL CHAIN (preview)">
                        <div className="px-3 lg:px-4 py-3 lg:py-4">
                            <ApprovalChainPreview
                                requestType="expenditure"
                                currentApprovalLevel={requestData?.currentApprovalLevel}
                                status={requestData?.status || "draft"}
                                approvals={requestData?.approvals || []}
                            />
                        </div>
                    </Section>
                </div>

                {/* ===== ACTIONS ===== */}
                {isRequestApproved && (
                    <div className="no-print flex flex-col lg:flex-row gap-2 px-3 md:px-6 py-3 md:py-4 bg-gray-50 dark:bg-[#1a385c] lg:justify-end">
                        <Button
                            variant="outline"
                            disabled={isLoading || isPrintingForm}
                            onClick={handlePrint}
                            className="border-blue-400 dark:border-[#3b6dae]/50 text-blue-600"
                        >
                            {(isLoading || isPrintingForm) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Printer size={16} className="mr-1" /> Print Form
                        </Button>
                        <Button
                            variant="outline"
                            disabled={isLoading || isExportingPdf}
                            onClick={handleDownloadPdf}
                            className="border-blue-400 dark:border-[#3b6dae]/50 text-blue-600"
                        >
                            {(isLoading || isExportingPdf) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Download size={16} className="mr-1" /> Download PDF
                        </Button>
                    </div>
                )}
                {!approvalSectionIsReadOnly && isCurrentApprover && (
                    <div className="no-print flex flex-col lg:flex-row gap-2 px-3 md:px-6 py-3 md:py-4 bg-gray-50 dark:bg-[#1a385c] lg:justify-end">
                        <Button
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => setShowRejectDialog(true)}
                            className="border-red-400 text-red-600 hover:bg-red-50"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject
                        </Button>
                        {requestData?.currentApprovalLevel === "head_of_finance" ? (
                            <>
                                <Button
                                    disabled={isLoading || !signatureFile}
                                    onClick={() => {
                                        if (!signatureFile) { toast.error("Please provide your signature before approving"); return; }
                                        onApprove({ comments: approvalComments, signatureFile, escalateToCeo: false });
                                    }}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Approve (Final)
                                </Button>
                                <Button
                                    disabled={isLoading || !signatureFile}
                                    onClick={() => {
                                        if (!signatureFile) { toast.error("Please provide your signature before approving"); return; }
                                        onApprove({ comments: approvalComments, signatureFile, escalateToCeo: true });
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Approve & Forward to CEO/MD
                                </Button>
                            </>
                        ) : (
                            <Button
                                disabled={isLoading || !signatureFile}
                                onClick={() => {
                                    if (!signatureFile) { toast.error("Please provide your signature before approving"); return; }
                                    onApprove({ comments: approvalComments, signatureFile });
                                }}
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Approve & Sign
                            </Button>
                        )}
                    </div>
                )}

                {/* ===== REJECT DIALOG ===== */}
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-red-600">Reject Request</DialogTitle>
                            <DialogDescription className="text-sm text-gray-600 mt-2">
                                Please provide a detailed reason for rejecting this expenditure request. This feedback will be shared with the requester.
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
                                disabled={rejectReason.trim().length < 1 || isLoading}
                                onClick={() => {
                                    if (rejectReason.trim().length >= 1) {
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
                <div className="text-center text-xs text-gray-600 dark:text-slate-400 py-3 border-t border-gray-200 space-y-1">
                    <p>www.centrika.rw</p>
                    <p>1 | Centrika Ltd | Motto: Delivering Tomorrow's Solutions Today</p>
                </div>
            </div>
        </div>
    );
}

/* ========= Helper Components ========= */

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <div className="lg:bg-[#3b6dae] lg:text-white font-bold px-4 py-2 text-sm">{title}</div>
            {children}
        </div>
    );
}

function Row({ label, children, colSpan = false }: { label: React.ReactNode; children: React.ReactNode; colSpan?: boolean }) {
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
