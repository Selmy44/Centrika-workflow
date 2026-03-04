"use client";

import { useState } from "react";
import { Loader2, Phone, Mail, Globe, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
    requestData: any;
    onApprove: (data: { comments?: string; signatureFile?: File }) => void;
    onReject: (reason: string) => void;
    isLoading?: boolean;
}

/**
 * ExpenditureRequestApprovalView - Read-only approval view for expenditure requests.
 * Shows expenditure details and provides approve/reject actions.
 */
export default function ExpenditureRequestApprovalView({ requestData, onApprove, onReject, isLoading = false }: Props) {
    const { user } = useAuth();
    const [approvalComments, setApprovalComments] = useState("");
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [signaturePreview, setSignaturePreview] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);

    const { data, isLoading: detailsLoading } = trpc.requests.getExpenditureRequestDetails.useQuery(
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
                <Loader2 className="animate-spin text-blue-400 mr-2" size={24} />
                <span className="text-gray-600">Loading expenditure request details...</span>
            </div>
        );
    }

    const exp = data?.expenditureDetails as any;
    const employee = data?.employee as any;

    const formatAmount = (amount: number | null | undefined, currency: string | null | undefined) => {
        if (!amount) return "N/A";
        return `${currency || "RWF"} ${amount.toLocaleString()}`;
    };

    return (
        <div className="w-full bg-white text-black">
            {/* ===== HEADER WITH LOGO AND CONTACT ===== */}
            <div className="flex justify-between items-start px-8 py-6 gap-12">
                <div className="shrink-0">
                    <img src="/logo/centrikaLogo.png" alt="Centrika Logo" className="h-24 w-auto" />
                </div>
                <div className="text-sm flex-1 flex justify-end">
                    <div className="flex flex-col gap-2 items-start">
                        <div className="flex items-center gap-2">
                            <Phone size={14} className="text-blue-600" />
                            <span className="text-blue-600 font-semibold text-xs">+250 788 123 099</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail size={14} className="text-blue-600" />
                            <span className="text-blue-600 font-semibold text-xs">info@centrika.rw</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe size={14} className="text-blue-600" />
                            <span className="text-blue-600 font-semibold text-xs">www.centrika.rw</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
                            <span className="text-blue-600 font-semibold text-xs">Room F002, 2nd Floor, CHIC Building, Plot 1007, KN2 Kigali-Rwanda</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== TITLE BAR ===== */}
            <div className="bg-yellow-600 text-white text-center font-bold py-2 text-lg tracking-wide">
                EXPENDITURE REQUEST FORM — APPROVAL
            </div>

            {/* ===== EMPLOYEE INFORMATION ===== */}
            <div className="border-t border-blue-400">
                <div className="bg-blue-700 text-white font-semibold px-4 py-2 text-sm">1. EMPLOYEE INFORMATION</div>
                <div className="grid grid-cols-2 border-b border-blue-400">
                    <Field label="Employee Name" value={employee?.name || "N/A"} />
                    <Field label="Staff ID" value={employee?.staffId || "N/A"} />
                    <Field label="Department" value={employee?.department || "N/A"} />
                    <Field label="Position" value={employee?.position || "N/A"} />
                </div>
            </div>

            {/* ===== EXPENDITURE DETAILS ===== */}
            <div className="border-t border-blue-400">
                <div className="bg-blue-700 text-white font-semibold px-4 py-2 text-sm">2. EXPENDITURE DETAILS</div>
                <div className="grid grid-cols-2 border-b border-blue-400">
                    <Field label="Request ID" value={`#${requestData?.id}`} />
                    <Field label="Submitted" value={new Date(requestData?.createdAt).toLocaleDateString()} />
                    <Field label="Type of Expenditure" value={exp?.category || "N/A"} />
                    <Field label="Amount" value={formatAmount(exp?.amount, exp?.currency)} />
                    <Field label="Department" value={exp?.department || employee?.department || "N/A"} />
                    <Field label="Currency" value={exp?.currency || "RWF"} />
                </div>
            </div>

            {/* ===== DESCRIPTION ===== */}
            {requestData?.description && (
                <div className="px-4 py-3 border-b border-blue-400">
                    <p className="text-xs text-blue-600 font-semibold mb-1">Purpose / Justification</p>
                    <p className="text-sm">{requestData.description}</p>
                </div>
            )}

            {/* ===== APPROVER ACTION SECTION ===== */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mx-6 my-6">
                <h2 className="font-bold text-yellow-700 mb-4">{getApprovalLevelLabel().toUpperCase()}</h2>

                {!showRejectForm ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700">Comments (Optional)</label>
                            <Textarea
                                placeholder="Add your comments or observations..."
                                value={approvalComments}
                                onChange={(e) => setApprovalComments(e.target.value)}
                                className="mt-2 border-gray-300"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-700">Your Signature</label>
                            <p className="text-xs text-gray-600 mb-2">Upload an image of your signature</p>
                            <div className="border-2 border-dashed border-yellow-400 rounded-lg p-4 bg-white">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleSignatureChange}
                                    className="block w-full text-sm text-gray-600"
                                />
                                {signaturePreview && (
                                    <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                                        <img src={signaturePreview} alt="signature" className="h-24 object-contain mx-auto" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-yellow-200">
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectForm(true)}
                                disabled={isLoading}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                                Reject Request
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 ml-auto"
                                onClick={() => onApprove({ comments: approvalComments, signatureFile: signatureFile || undefined })}
                                disabled={isLoading}
                            >
                                {isLoading ? "Processing..." : "Approve Request"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700">Reason for Rejection</label>
                            <Textarea
                                placeholder="Please explain why you are rejecting this request..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="mt-2 border-gray-300"
                                rows={4}
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => onReject(rejectReason)}
                                disabled={isLoading || !rejectReason.trim()}
                                className="ml-auto"
                            >
                                {isLoading ? "Processing..." : "Confirm Rejection"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ========= Helper ========= */
function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="px-4 py-3 border-b border-r border-blue-200">
            <p className="text-xs text-blue-600 font-semibold mb-0.5">{label}</p>
            <p className="text-sm font-medium">{value}</p>
        </div>
    );
}
