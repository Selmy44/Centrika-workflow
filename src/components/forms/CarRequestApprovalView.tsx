"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Eye, Paperclip, ArrowRight, ArrowLeftRight, Car } from "lucide-react";
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
    try {
        const arr = base64.split(",");
        if (arr.length < 2) return null;
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    } catch (e) {
        console.error("Error converting base64 to file", e);
        return null;
    }
};

interface Props {
    requestData: any;
    onApprove: (data: { comments?: string; signatureFile?: File }) => void;
    onReject: (reason: string) => void;
    isLoading?: boolean;
    onClose?: () => void;
    onBack?: () => void;
}

export default function CarRequestApprovalView({ requestData, onApprove, onReject, isLoading = false, onClose, onBack }: Props) {
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

    const { data, isLoading: detailsLoading } = trpc.requests.getCarRequestDetails.useQuery(
        { requestId: requestData?.id || 0 },
        { enabled: !!requestData?.id }
    );

    const { data: formDataDynamic } = trpc.requests.getCarFormData.useQuery(
        { requestId: requestData?.id || 0 },
        { enabled: !!requestData?.id }
    );

    if (detailsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-slate-400">Loading car request details...</p>
                </div>
            </div>
        );
    }

    const car = data?.carDetails as any;
    const employee = data?.employee as any;

    const handlePrint = () => {
        const formElement = getActiveFormElement();
        if (!formElement) {
            toast.error("Form content not found for printing");
            return;
        }
        try {
            setIsPrintingForm(true);
            printFormElement({ element: formElement, title: `Car Request #${requestData?.id || ""}` });
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
                fileName: `car-request-${requestData?.id || Date.now()}.pdf`,
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
                {/* HEADER SECTION */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start px-3 lg:px-6 py-3 gap-4 lg:gap-8">
                    <div className="shrink-0">
                        <img src="/logo/centrikaLogo.png" alt="Centrika Logo" className="h-14 lg:h-20 w-auto" />
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

                {/* TITLE BAR */}
                <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide flex items-center justify-center gap-2">
                    <Car size={18} /> CAR / TRANSPORT REQUEST FORM — APPROVAL
                </div>

                {/* REJECTION ALERT */}
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
                                <p className="text-sm text-red-700">This car request has been rejected and is now read-only.</p>
                            </div>
                        </div>
                    </div>
                )}



                {/* DETAILS SECTIONS */}
                <div className="divide-y divide-[#3b6dae]/30">
                    <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">REQUEST DETAILS</div>
                    <Section title="1. EMPLOYEE INFORMATION">
                        <Row label="1.1 Request Number">
                            <Input value={formDataDynamic?.documentId || (() => { const d = requestData?.createdAt ? new Date(requestData.createdAt) : new Date(); return `CR-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(requestData?.id||'').padStart(5,'0')}`; })()} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.2 Date of Request">
                            <Input value={requestData?.createdAt ? (() => { const d = new Date(requestData.createdAt); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })() : "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.3 Employee Full Name">
                            <Input value={employee?.name || formDataDynamic?.employeeName || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.4 Department">
                            <Input value={employee?.department?.name || formDataDynamic?.department || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.5 Employee / Staff ID">
                            <Input value={employee?.staffId || formDataDynamic?.staffId || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.6 Position / Title">
                            <Input value={employee?.position || formDataDynamic?.position || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.7 Work Email">
                            <Input value={employee?.email || formDataDynamic?.workEmail || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                    </Section>

                    <Section title="2. TRIP DETAILS">
                        <Row label="2.1 Trip Type">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                (formDataDynamic?.tripType || "round_trip") === "round_trip"
                                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                            }`}>
                                {(formDataDynamic?.tripType || "round_trip") === "round_trip"
                                    ? <><ArrowLeftRight size={11} /> Round Trip</>
                                    : <><ArrowRight size={11} /> One Way</>}
                            </span>
                        </Row>
                        <Row label="2.2 Pickup Location">
                            <Input value={formDataDynamic?.pickupLocation || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="2.3 Destination">
                            <Input value={car?.destination || formDataDynamic?.destination || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="2.4 Departure Date">
                            <Input value={(() => { const d = car?.departureDate || formDataDynamic?.departureDate || ""; if (!d) return "N/A"; const p = d.split("-"); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d; })()} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="2.5 Departure Time">
                            <Input value={car?.departureTime || formDataDynamic?.departureTime || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        {(formDataDynamic?.tripType === "round_trip" || !formDataDynamic?.tripType) && (
                            <>
                                <Row label="2.6 Return Date">
                                    <Input value={(() => { const d = formDataDynamic?.returnDate || ""; if (!d) return "N/A"; const p = d.split("-"); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d; })()} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                                </Row>
                                {formDataDynamic?.returnTime && (
                                    <Row label="2.7 Return Time">
                                        <Input value={formDataDynamic.returnTime} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                                    </Row>
                                )}
                            </>
                        )}
                        <Row label="2.8 Passengers">
                            <Input value={`${car?.passengers || formDataDynamic?.passengers || "1"} person(s)`} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                    </Section>

                    <Section title="3. TRIP PURPOSE">
                        <Row label="3.1 Request Title">
                            <Input value={requestData?.title || formDataDynamic?.title || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="3.2 Purpose">
                            <Textarea value={car?.purpose || formDataDynamic?.purpose || "N/A"} disabled className="min-h-16 border-blue-300 dark:border-[#3b6dae]/40 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium resize-none" />
                        </Row>
                    </Section>

                    <Section title="4. DRIVER & VEHICLE">
                        <Row label="4.1 Driver">
                            <Input value={car?.driverName || formDataDynamic?.driverName || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                        <Row label="4.2 Assigned Vehicle">
                            <Input value={car?.carInfo || formDataDynamic?.carInfo || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 font-medium" />
                        </Row>
                    </Section>

                    <Section title="5. EMPLOYEE SIGNATURE">
                        <Row label="5.1 Signature">
                            {formDataDynamic?.employeeSignatureUrl ? (
                                <div className="py-1">
                                    <img src={formDataDynamic.employeeSignatureUrl} alt="Employee Signature" className="h-14 object-contain" />
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{requestData?.user?.name || "Employee"}</p>
                                </div>
                            ) : (
                                <p className="text-xs italic text-gray-500">No signature</p>
                            )}
                        </Row>
                    </Section>

                    <Section title="6. APPROVER SIGNATURES">
                        {(formDataDynamic?.hrSignatureUrl || requestData?.hrSignatureUrl) && (
                            <Row label="6.1 Approved Signature">
                                <div className="py-1">
                                    <img src={formDataDynamic?.hrSignatureUrl || requestData?.hrSignatureUrl} alt="Approver Signature" className="h-14 object-contain" />
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{formDataDynamic?.hrSignerName || requestData?.approvals?.find((a: any) => a.approvalLevel === "hr")?.approver?.name || ""}</p>
                                </div>
                            </Row>
                        )}

                        {/* YOUR APPROVAL SECTION */}
                        {!approvalSectionIsReadOnly && (
                            <div className="border-t border-blue-200 dark:border-[#3b6dae]/40">
                                <Row label="6.2 Your Comment">
                                    <div className="space-y-3 py-1 w-full">
                                        <Textarea
                                            value={approvalComments}
                                            onChange={(e) => setApprovalComments(e.target.value)}
                                            placeholder="Add your comments or observations here..."
                                            className="min-h-20 text-xs border-blue-300 dark:border-[#3b6dae]/40 bg-white dark:bg-[#1a385c]"
                                        />
                                    </div>
                                </Row>
                                <Row label="6.3 Your Signature">
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
                                                    const file = base64ToFile(dataUrl, "signature.png");
                                                    if (file) setSignatureFile(file);
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
                                                <img src={signaturePreview} alt="Preview" className="h-12 object-contain" />
                                            </div>
                                        )}
                                    </div>
                                </Row>
                            </div>
                        )}
                    </Section>

                    {/* 7. APPROVAL CHAIN (preview) */}
                    <Section title="7. APPROVAL CHAIN (preview)">
                        <div className="px-3 lg:px-4 py-3 lg:py-4">
                            <ApprovalChainPreview
                                requestType="car"
                                currentApprovalLevel={requestData?.currentApprovalLevel}
                                status={requestData?.status || "draft"}
                                approvals={requestData?.approvals || []}
                            />
                        </div>
                    </Section>
                </div>

                {/* ACTIONS */}
                {isRequestApproved && (
                    <div className="no-print flex flex-col lg:flex-row gap-2 p-3 md:p-6 border-t bg-gray-50 lg:justify-end">
                        <Button variant="outline" size="sm" onClick={handlePrint} disabled={isPrintingForm || isLoading}>
                            {(isPrintingForm || isLoading) && <Loader2 size={16} className="mr-2 animate-spin" />}
                            <Printer size={16} className="mr-2" /> Print Form
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isExportingPdf || isLoading}>
                            {(isExportingPdf || isLoading) && <Loader2 size={16} className="mr-2 animate-spin" />}
                            <Download size={16} className="mr-2" /> Download PDF
                        </Button>
                    </div>
                )}
                {!approvalSectionIsReadOnly && (
                    <div className="no-print flex flex-col lg:flex-row gap-2 p-3 md:p-6 bg-gray-50 lg:justify-end">
                        <Button variant="destructive" size="sm" onClick={() => setShowRejectDialog(true)} disabled={isLoading}>Reject</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            size="sm"
                            onClick={() => {
                                if (!signatureFile) {
                                    toast.error("Please provide your signature before approving");
                                    return;
                                }
                                onApprove({ comments: approvalComments, signatureFile });
                            }}
                            disabled={isLoading || !signatureFile}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve & Sign
                        </Button>
                    </div>
                )}

                <div className="text-center text-[10px] text-gray-400 py-4 border-t">
                    <p>www.centrika.rw | Centrika Ltd | Delivering Tomorrow's Solutions Today</p>
                </div>
            </div>

            {/* REJECT DIALOG */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-red-600">Reject Request</DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 mt-2">
                            Please provide a detailed reason for rejection. This feedback will be shared with the requester.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Rejection Reason *</label>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Provide a reason for rejection..."
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
                            Confirm Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

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
