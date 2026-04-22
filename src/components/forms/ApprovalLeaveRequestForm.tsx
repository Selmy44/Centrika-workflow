"use client";

import React, { useState, useEffect } from "react";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
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
import { toast } from "sonner";
import { SignaturePad } from "@/components/SignaturePad";
import { base64ToFile } from "@/lib/fileUtils";

interface Props {
  request: any;
  onApprove: (comments: string, signatureFile: File | null) => void;
  onReject: (reason: string) => void;
  isLoading?: boolean;
}

/**
 * ApprovalLeaveRequestForm - Form viewed by HOD/HR/CEO for approving leave requests
 * Shows employee details, leave info, and approver signature field
 */
export default function ApprovalLeaveRequestForm({ request, onApprove, onReject, isLoading = false }: Props) {
  const { user } = useAuth();
  const [approvalComments, setApprovalComments] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState("");
  const [signatureMethod, setSignatureMethod] = useState<"upload" | "draw">("draw");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedHR, setSelectedHR] = useState("");
  const [submittedFormData, setSubmittedFormData] = useState<any>(null);

  const { data: formData, isLoading: formLoading } = trpc.requests.getLeaveFormData.useQuery(
    { requestId: request?.id || 0 },
    { 
      enabled: !!request?.id,
      staleTime: Infinity,
    }
  );

  // Update form data when it loads
  useEffect(() => {
    if (formData) {
      setSubmittedFormData(formData);
    }
  }, [formData]);

  // Get list of HR users
  const { data: hrUsers = [] } = trpc.users.getHRUsers.useQuery(undefined, {
    staleTime: Infinity,
    retry: 1,
  });

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureFile(file);
      const url = URL.createObjectURL(file);
      setSignaturePreview(url);
    }
  };

  const getApprovalLevelLabel = () => {
    switch (user?.role) {
      case "head_of_department":
        return "Department Head Approval";
      case "hr":
        return "HR Approval";
      case "head_of_finance":
        return "Finance Head Approval";
      case "ceo_md":
        return "CEO/MD Final Approval";
      default:
        return "Approval";
    }
  };

  const shouldShowHRSelector = user?.role === "head_of_department";

  // Show loading state while form data is being fetched
  if (formLoading) {
    return (
      <div className="w-full bg-white dark:bg-[#1f426b] text-black dark:text-slate-100 px-8 py-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block mb-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
            <p className="text-gray-600 dark:text-slate-400">Loading employee's submitted form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-[#1f426b] text-black dark:text-slate-100 px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start pb-6 border-b-2 border-blue-300 dark:border-[#3b6dae]/40">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Leave Request Approval Form</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{getApprovalLevelLabel()}</p>
          {submittedFormData && <p className="text-xs text-green-600 mt-1">✓ Form loaded from employee submission</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Request ID: #{request?.id}</p>
          <p className="text-xs text-gray-500">Submitted: {new Date(request?.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Employee Information Section - From Submitted Form */}
      <div className="bg-blue-50 border border-blue-200 dark:border-[#3b6dae]/30 rounded-lg p-4">
        <h2 className="font-bold text-blue-700 mb-3">EMPLOYEE INFORMATION</h2>
        <p className="text-xs text-blue-600 mb-3">From employee's submitted form</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Employee Name</label>
            <p className="text-foreground font-medium">{submittedFormData?.employeeName || request?.user?.name || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Email</label>
            <p className="text-foreground font-medium">{request?.user?.email || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Department</label>
            <p className="text-foreground font-medium">{submittedFormData?.department || request?.user?.department || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Staff ID</label>
            <p className="text-foreground font-medium">{submittedFormData?.staffId || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Position</label>
            <p className="text-foreground font-medium">{submittedFormData?.position || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Request ID</label>
            <p className="text-foreground font-medium">#{request?.id}</p>
          </div>
        </div>
      </div>

      {/* Leave Request Details - From Submitted Form */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="font-bold text-blue-700 mb-3">LEAVE REQUEST DETAILS</h2>
        <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">Exact data from employee's submission</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Leave Type</label>
            <p className="text-foreground font-medium capitalize">{submittedFormData?.leaveType || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Start Date</label>
            <p className="text-foreground font-medium">{submittedFormData?.startDate || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">End Date</label>
            <p className="text-foreground font-medium">{submittedFormData?.endDate || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Leave Days Requested</label>
            <p className="text-foreground font-medium">{submittedFormData?.leaveDaysRequested || "N/A"}</p>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Reason/Description</label>
            <p className="text-foreground font-medium">{submittedFormData?.reason || request?.description || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Leave Days Entitled</label>
            <p className="text-foreground font-medium">{submittedFormData?.leaveDaysEntitled || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Leave Days Taken</label>
            <p className="text-foreground font-medium">{submittedFormData?.leaveDaysTaken || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Leave Days Remaining</label>
            <p className="text-foreground font-medium">{submittedFormData?.leaveDaysRemaining || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-slate-400 font-semibold">Backup Contact</label>
            <p className="text-foreground font-medium">{submittedFormData?.backupName || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Approver Signature & Comments Section */}
      {request?.status !== "approved" && request?.status !== "rejected" && (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
        <h2 className="font-bold text-yellow-700 mb-4">{getApprovalLevelLabel().toUpperCase()}</h2>

        {!showRejectForm ? (
          <div className="space-y-4">
            {/* Comments */}
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

            {/* Signature Section */}
            <div>
              <label className="text-sm font-semibold text-gray-700">Your Signature</label>
              <div className="flex gap-4 my-2">
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
                  <span className="text-xs font-black uppercase tracking-widest text-[#3b6dae] group-hover:text-blue-800">Draw Signature</span>
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
                  <span className="text-xs font-black uppercase tracking-widest text-[#3b6dae] group-hover:text-blue-800">Upload Image</span>
                </label>
              </div>

              {signatureMethod === "upload" ? (
                <div className="border-2 border-dashed border-yellow-400 rounded-lg p-4 bg-white dark:bg-[#1f426b] animate-in fade-in slide-in-from-top-2 duration-300">
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
                    className="block w-full text-sm text-gray-600 dark:text-slate-400"
                  />
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
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
                </div>
              )}

              {signaturePreview && (
                <div className="mt-3 p-2 bg-gray-50 dark:bg-[#1a385c] rounded border border-gray-200 animate-in zoom-in duration-300">
                  <img src={signaturePreview} alt="signature" className="h-24 object-contain mx-auto" />
                  <button
                    type="button"
                    onClick={() => {
                      setSignaturePreview("");
                      setSignatureFile(null);
                    }}
                    className="block mx-auto mt-2 text-[10px] text-red-600 hover:text-red-800 font-bold uppercase underline"
                  >
                    Clear and Change
                  </button>
                </div>
              )}
            </div>

            {/* HR Selector - only for HOD */}
            {shouldShowHRSelector && (
              <div>
                <label className="text-sm font-semibold text-gray-700">Select HR to Route This Request</label>
                <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">Choose who will review this request at the HR stage</p>
                <Select value={selectedHR} onValueChange={setSelectedHR}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select HR approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {hrUsers.map((hr: any) => (
                      <SelectItem key={hr.id} value={String(hr.id)}>
                        {hr.name} ({hr.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Buttons */}
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
                onClick={() => onApprove(approvalComments, signatureFile)}
                disabled={isLoading || !signatureFile}
              >
                {isLoading ? "Processing..." : "Approve Request"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Reason for Rejection *</label>
              <Textarea
                placeholder="Provide a clear and professional reason for rejection (minimum 10 characters)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2 border-red-300 focus:border-red-500 focus:ring-red-500 min-h-24 text-sm"
                rows={4}
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{rejectReason.length}/500 characters</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
                disabled={isLoading}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (rejectReason.trim().length >= 10) {
                    onReject(rejectReason);
                    setRejectReason("");
                    setShowRejectForm(false);
                  }
                }}
                disabled={rejectReason.trim().length < 10 || isLoading}
                className="ml-auto bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {isLoading ? "Processing..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Footer Info */}
      <div className="bg-gray-50 dark:bg-[#1a385c] border border-gray-200 rounded p-3 text-xs text-gray-600 dark:text-slate-400">
        <p className="font-semibold mb-1">Approval Process</p>
        <p>By approving this request, you acknowledge that you have reviewed all details and approve proceeding to the next stage.</p>
      </div>
    </div>
  );
}
