"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Eye } from "lucide-react";
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
                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start px-3 md:px-8 py-4 md:py-6 gap-4 md:gap-12">
                    <div className="shrink-0">
                        <img src="/logo/centrikaLogo.png" alt="Centrika Logo" className="h-14 md:h-32 w-auto" />
                    </div>
                    <div className="text-xs md:text-sm flex-1 flex justify-start md:justify-end">
                        <div className="flex flex-col gap-2 md:gap-3 items-start">
                            <div className="flex items-center gap-2 min-w-0">
                                <Phone size={14} className="text-blue-600 shrink-0 md:w-[16px] md:h-[16px]" />
                                <span className="text-blue-600 font-semibold truncate text-[11px] md:text-sm">+250 788 123 099</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <Mail size={14} className="text-blue-600 shrink-0 md:w-[16px] md:h-[16px]" />
                                <span className="text-blue-600 font-semibold truncate text-[11px] md:text-sm">info@centrika.rw</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <Globe size={14} className="text-blue-600 shrink-0 md:w-[16px] md:h-[16px]" />
                                <span className="text-blue-600 font-semibold truncate text-[11px] md:text-sm">www.centrika.rw</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5 md:w-[16px] md:h-[16px]" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-blue-600 font-semibold text-[10px] md:text-sm leading-tight">Room F002, 2nd Floor, CHIC Building,</span>
                                    <span className="text-blue-600 font-semibold text-[10px] md:text-sm leading-tight">Plot 1007, KN2 Kigali-Rwanda</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TITLE BAR */}
                <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide">
                    CAR REQUEST FORM — APPROVAL
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

                {/* HEADER INFO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm items-end border-b border-gray-200">
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-xs">Department</p>
                        <Input value={employee?.department || "N/A"} disabled className="h-7 text-xs bg-gray-50" />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-xs">Date Submitted</p>
                        <Input value={requestData?.createdAt ? new Date(requestData.createdAt).toLocaleDateString() : "N/A"} disabled className="h-7 text-xs bg-gray-50" />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1">Staff ID</p>
                        <Input value={employee?.staffId || "N/A"} disabled className="h-7 text-xs bg-gray-50" />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1">Employee Name</p>
                        <Input value={employee?.name || "N/A"} disabled className="h-7 text-xs bg-gray-50" />
                    </div>
                </div>

                {/* DETAILS SECTIONS */}
                <div className="divide-y divide-[#3b6dae]/30">
                    <Section title="1. EMPLOYEE INFORMATION">
                        <Row label="1.1 Employee Full Name">
                            <Input value={employee?.name || "N/A"} disabled className="h-7 text-xs bg-gray-50" />
                        </Row>
                        <Row label="1.2 Staff ID">
                            <Input value={employee?.staffId || "N/A"} disabled className="h-7 text-xs bg-gray-50" />
                        </Row>
                        <Row label="1.3 Department">
                            <Input value={employee?.department || "N/A"} disabled className="h-7 text-xs bg-gray-50" />
                        </Row>
                    </Section>

                    <Section title="2. CAR REQUEST DETAILS">
                        <Row label="2.1 Request ID">
                            <Input value={`#${requestData?.id}`} disabled className="h-7 text-xs bg-gray-50" />
                        </Row>
                        <Row label="2.2 Destination">
                            <Input value={car?.destination || "N/A"} disabled className="h-7 text-xs bg-gray-50" />
                        </Row>
                        <Row label="2.3 Departure">
                            <Input value={`${car?.departureDate || ""} ${car?.departureTime || ""}`} disabled className="h-7 text-xs bg-gray-50" />
                        </Row>
                        <Row label="2.4 Passengers">
                            <Input value={car?.passengers?.toString() || "0"} disabled className="h-7 text-xs bg-gray-50" />
                        </Row>
                        <Row label="2.5 Vehicle & Driver">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Driver:</p>
                                <Input value={car?.driverName || "N/A"} disabled className="h-7 text-xs bg-gray-50" />
                                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Vehicle:</p>
                                <Input value={car?.carInfo || "N/A"} disabled className="h-7 text-xs bg-gray-50" />
                            </div>
                        </Row>
                    </Section>

                    <Section title="3. EMPLOYEE SIGNATURE">
                        <Row label="3.1 Signature">
                            {formDataDynamic?.employeeSignatureUrl ? (
                                <img src={formDataDynamic.employeeSignatureUrl} alt="Employee" className="h-10 object-contain border rounded p-1" />
                            ) : (
                                <p className="text-xs italic text-gray-500">No signature</p>
                            )}
                        </Row>
                    </Section>

                    <Section title="4. APPROVAL WORKFLOW">
                        {/* HOD / Manager */}
                        {formDataDynamic?.managerSignatureUrl && (
                            <Row label="4.1 Line Manager / HOD">
                                <div className="py-1">
                                    <p className="text-[10px] font-bold text-gray-400 mb-1">APPROVED BY HOD:</p>
                                    <img src={formDataDynamic.managerSignatureUrl} alt="HOD" className="h-10 object-contain border rounded p-1" />
                                </div>
                            </Row>
                        )}

                        {/* HR */}
                        <Row label="4.2 HR Approval">
                            {formDataDynamic?.hrSignatureUrl ? (
                                <div className="py-1">
                                    <p className="text-[10px] font-bold text-gray-400 mb-1">APPROVED BY HR:</p>
                                    <img src={formDataDynamic.hrSignatureUrl} alt="HR" className="h-10 object-contain border rounded p-1" />
                                </div>
                            ) : (
                                <p className="text-xs italic text-gray-500 py-2">Awaiting HR Review</p>
                            )}
                        </Row>

                        {/* YOUR APPROVAL SECTION */}
                        {!approvalSectionIsReadOnly && (
                            <div className="bg-blue-50/50 p-4 border-t border-blue-200">
                                <h4 className="text-sm font-bold text-blue-700 mb-3">Your Decision ({user?.role?.replace(/_/g, ' ')})</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Comments</label>
                                        <Textarea
                                            value={approvalComments}
                                            onChange={(e) => setApprovalComments(e.target.value)}
                                            placeholder="Enter your observations..."
                                            className="min-h-20 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Signature</label>
                                        <div className="flex gap-4 mb-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" checked={signatureMethod === "draw"} onChange={() => setSignatureMethod("draw")} />
                                                <span className="text-xs">Draw</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" checked={signatureMethod === "upload"} onChange={() => setSignatureMethod("upload")} />
                                                <span className="text-xs">Upload</span>
                                            </label>
                                        </div>

                                        {signatureMethod === "upload" ? (
                                            <Input
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
                                                className="text-xs"
                                            />
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

                                        {signaturePreview && (
                                            <div className="mt-2 p-2 border rounded bg-white inline-block relative">
                                                <img src={signaturePreview} alt="Preview" className="h-12 object-contain" />
                                                <button
                                                    onClick={() => { setSignatureFile(null); setSignaturePreview(""); }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                                                >✕</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Section>
                </div>

                {/* ACTIONS */}
                {isRequestApproved && (
                    <div className="no-print flex flex-col sm:flex-row gap-2 p-3 md:p-6 border-t bg-gray-50">
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
                    <div className="no-print flex flex-col gap-2 p-3 md:p-6 bg-gray-50">
                        <Button variant="destructive" size="sm" onClick={() => setShowRejectDialog(true)} disabled={isLoading}>Reject</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                            onClick={() => onApprove({ comments: approvalComments, signatureFile: signatureFile || undefined })}
                            disabled={isLoading}
                        >
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
                                placeholder="Provide a clear and professional reason for rejection (minimum 10 characters)..."
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
                            Confirm Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="md:bg-[#3b6dae] md:text-white font-bold px-4 py-2 text-xs uppercase tracking-wider">{title}</div>
            <div className="bg-white">{children}</div>
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-0">
            <div className="px-2 md:px-4 py-2 md:py-3 md:bg-blue-50/30 text-[10px] md:text-[11px] font-bold text-gray-500 uppercase flex items-center">{label}</div>
            <div className="px-2 md:px-4 py-1.5 md:py-2">{children}</div>
        </div>
    );
}
