"use client";

import { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Props {
    requestData: any;
    onApprove: (data: { comments?: string; signatureFile?: File }) => void;
    onReject: (reason: string) => void;
    isLoading?: boolean;
    onClose?: () => void;
    onBack?: () => void;
}

/**
 * CarRequestApprovalView - Read-only approval view for car requests.
 * Styled to match LeaveRequestForm design system.
 */
export default function CarRequestApprovalView({ requestData, onApprove, onReject, isLoading = false, onClose, onBack }: Props) {
    const { user } = useAuth();
    const [approvalComments, setApprovalComments] = useState("");
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [signaturePreview, setSignaturePreview] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectDialog, setShowRejectDialog] = useState(false);

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

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSignatureFile(file);
            setSignaturePreview(URL.createObjectURL(file));
        }
    };

    const getApprovalLevelLabel = () => {
        switch (user?.role) {
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
                    <p className="text-gray-600 dark:text-slate-400">Loading car request details...</p>
                </div>
            </div>
        );
    }

    const car = data?.carDetails as any;
    const employee = data?.employee as any;

    return (
        <div className="w-full bg-white dark:bg-[#1f426b] text-black dark:text-slate-100 px-10 leave-form-container relative dark:border-[#2b6cb0]/30">

            {/* CLOSE/BACK BUTTON */}
            <button
                onClick={() => onBack ? onBack() : (onClose ? onClose() : window.history.back())}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:bg-[#295482] rounded-lg transition"
                title="Close form"
            >
                <svg className="w-6 h-6 text-gray-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div>
                {/* ===== HEADER WITH LOGO AND CONTACT INFO ===== */}
                <div className="flex justify-between items-start px-8 py-6 gap-12">
                    <div className="shrink-0">
                        <img
                            src="/logo/centrikaLogo.png"
                            alt="Centrika Logo"
                            className="h-32 w-auto"
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
                    CAR REQUEST FORM — APPROVAL
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
                                <p className="text-sm text-red-700">This car request has been rejected and is now read-only.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== REQUEST HEADER SECTION ===== */}
                <div className="grid grid-cols-4 gap-3 px-6 py-3 text-sm items-end">
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-xs">Department</p>
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
                        <p className="font-semibold text-blue-600 mb-1 text-xs">Date Submitted</p>
                        <Input
                            type="text"
                            value={requestData?.createdAt ? new Date(requestData.createdAt).toLocaleDateString() : "N/A"}
                            className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
                            disabled
                        />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1">Staff ID</p>
                        <Input
                            value={employee?.staffId || "N/A"}
                            className="h-7 border-blue-400 dark:border-[#3b6dae]/50 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed"
                            disabled
                        />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1">Employee Name</p>
                        <Input
                            value={employee?.name || "N/A"}
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
                        <Row label="1.1 Employee Full Name">
                            <Input value={employee?.name || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.2 Staff ID">
                            <Input value={employee?.staffId || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.3 Department">
                            <Input value={employee?.department || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="1.4 Position / Title">
                            <Input value={employee?.position || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                    </Section>

                    {/* 2. CAR REQUEST DETAILS */}
                    <Section title="2. CAR REQUEST DETAILS">
                        <Row label="2.1 Request ID">
                            <Input value={`#${requestData?.id}`} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="2.2 Destination">
                            <Input value={car?.destination || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="2.3 Departure Date">
                            <Input value={car?.departureDate || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="2.4 Departure Time">
                            <Input value={car?.departureTime || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="2.5 Number of Passengers">
                            <div className="flex gap-2 items-center">
                                <Input value={car?.passengers?.toString() || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Person(s)</span>
                            </div>
                        </Row>
                        <Row label="2.6 Driver">
                            <Input value={car?.driverName || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        <Row label="2.7 Vehicle">
                            <Input value={car?.carInfo || "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                        {car?.purpose && (
                            <Row label="2.8 Purpose">
                                <Textarea value={car.purpose} disabled className="min-h-20 border-blue-300 dark:border-[#3b6dae]/40 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100" />
                            </Row>
                        )}
                        {requestData?.title && (
                            <Row label="2.9 Request Title">
                                <Input value={requestData.title} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                            </Row>
                        )}
                        {requestData?.description && (
                            <Row label="2.10 Description">
                                <Textarea value={requestData.description} disabled className="min-h-20 border-blue-300 dark:border-[#3b6dae]/40 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100" />
                            </Row>
                        )}
                    </Section>

                    {/* 3. EMPLOYEE SIGNATURE */}
                    <Section title="3. EMPLOYEE SIGNATURE">
                        <Row label="3.1 Employee Signature">
                            {formDataDynamic?.employeeSignatureUrl ? (
                                <img src={formDataDynamic.employeeSignatureUrl} alt="Employee Signature" className="h-10 object-contain border border-blue-200 dark:border-[#3b6dae]/30 rounded p-1 bg-white dark:bg-[#1f426b]" />
                            ) : (
                                <p className="text-xs italic text-gray-500">No signature provided</p>
                            )}
                        </Row>
                        <Row label="3.2 Submission Date">
                            <Input value={requestData?.createdAt ? new Date(requestData.createdAt).toLocaleDateString() : "N/A"} disabled className="border-blue-300 dark:border-[#3b6dae]/40 h-7 text-xs bg-gray-100 dark:bg-[#295482] cursor-not-allowed !text-black dark:!text-slate-100 dark:text-slate-100 dark:!text-slate-100 dark:text-slate-100 font-medium" />
                        </Row>
                    </Section>

                    {/* 4. APPROVAL WORKFLOW */}
                    <Section title="4. APPROVAL WORKFLOW">
                        {formDataDynamic?.managerSignatureUrl && (
                            <Row label="4.1 Line Manager / HOD">
                                <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">Approved by HOD:</p>
                                    <img src={formDataDynamic.managerSignatureUrl} alt="HOD Signature" className="h-10 object-contain border border-blue-200 dark:border-[#3b6dae]/30 rounded p-1 bg-white dark:bg-[#1f426b]" />
                                </div>
                            </Row>
                        )}

                        <Row label="4.2 HR Approval">
                            {formDataDynamic?.hrSignatureUrl ? (
                                <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">Approved by HR:</p>
                                    <img src={formDataDynamic.hrSignatureUrl} alt="HR Signature" className="h-10 object-contain border border-blue-200 dark:border-[#3b6dae]/30 rounded p-1 bg-white dark:bg-[#1f426b]" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 py-2">
                                    <span className="text-xs italic text-gray-500">Awaiting HR Review</span>
                                </div>
                            )}
                            {isRequestRejected && (
                               <div className="mt-2 bg-red-100 text-red-700 px-3 py-1.5 rounded text-xs font-bold inline-block">
                                   ✗ REJECTED
                               </div>
                            )}
                        </Row>

                        {!approvalSectionIsReadOnly && (
                            <div className="p-4 border-b border-blue-400 dark:border-[#3b6dae]/50 bg-blue-50/30">
                                <h3 className="text-sm font-bold text-blue-700 mb-3">Your Approval ({user?.role || "Approver"})</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold block mb-1">Comments</label>
                                        <Textarea
                                            placeholder="Add your comments or observations..."
                                            value={approvalComments}
                                            onChange={(e) => setApprovalComments(e.target.value)}
                                            className="border-blue-300 dark:border-[#3b6dae]/40 min-h-20 text-xs bg-white dark:bg-[#1f426b]"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold block mb-1">Your Signature</label>
                                        <div className="space-y-3">
                                            {!signaturePreview ? (
                                                <>
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={handleSignatureChange}
                                                        disabled={isLoading}
                                                        className="block w-full text-xs text-gray-600 dark:text-slate-400 border border-dashed border-blue-300 dark:border-[#3b6dae]/40 rounded p-2 cursor-pointer bg-white dark:bg-[#1f426b]"
                                                    />
                                                </>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="p-3 border border-blue-200 dark:border-[#3b6dae]/30 rounded bg-white dark:bg-[#1f426b]">
                                                        <img src={signaturePreview} alt="approver-signature" className="h-12 object-contain" />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSignaturePreview("");
                                                            setSignatureFile(null);
                                                        }}
                                                        className="text-xs text-red-600 hover:text-red-800 font-semibold"
                                                    >
                                                        Remove Signature
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Section>
                </div>

                {/* ===== ACTIONS ===== */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-blue-400 dark:border-[#3b6dae]/50 bg-gray-50 dark:bg-[#1a385c] gap-4">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => window.print()}
                            className="border-blue-400 dark:border-[#3b6dae]/50 text-blue-600"
                        >
                            <Printer size={16} className="mr-1" /> Print
                        </Button>
                        <Button
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => {
                                toast.info("Download functionality requires backend PDF generation");
                            }}
                            className="border-blue-400 dark:border-[#3b6dae]/50 text-blue-600"
                        >
                            <Download size={16} className="mr-1" /> Download
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        {!approvalSectionIsReadOnly && (
                            <>
                                <Button
                                    variant="outline"
                                    disabled={isLoading}
                                    onClick={() => setShowRejectDialog(true)}
                                    className="border-red-400 text-red-600 hover:bg-red-50"
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Reject
                                </Button>
                                <Button
                                    disabled={isLoading}
                                    onClick={() => onApprove({ comments: approvalComments, signatureFile: signatureFile || undefined })}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Approve {signatureFile ? "& Sign" : ""}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* ===== REJECT DIALOG ===== */}
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Request</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for rejecting this car request.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            placeholder="Enter rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={!rejectReason || isLoading}
                                onClick={() => {
                                    onReject(rejectReason);
                                }}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Reject
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border-t border-[#3b6dae]">
            <div className="bg-[#3b6dae] text-white font-bold px-4 py-2 text-sm">{title}</div>
            {children}
        </div>
    );
}

function Row({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-[220px_1fr] border-b border-[#3b6dae]">
            <div className="px-3 py-2 font-medium border-r border-[#3b6dae] bg-blue-100 text-[#3b6dae] text-xs">
                {label}
            </div>
            <div className="px-3 py-1">{children}</div>
        </div>
    );
}
