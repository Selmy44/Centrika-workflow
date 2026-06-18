"use client";

import React from "react";
import { CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";

/**
 * Approval chain definitions per request type.
 * Each step maps to a role key used in `currentApprovalLevel` and `approvals[].approvalLevel`.
 */
const APPROVAL_CHAINS: Record<string, { role: string; label: string }[]> = {
  leave: [{ role: "head_of_department", label: "Head of Dept" }],
  car: [{ role: "hr", label: "HR" }],
  expenditure: [
    { role: "head_of_department", label: "Head of Dept" },
    { role: "head_of_finance", label: "Head of Finance" },
    { role: "ceo_md", label: "CEO / MD" },
  ],
  asset: [
    { role: "head_of_department", label: "Head of Dept" },
    { role: "head_of_finance", label: "Head of Finance" },
    { role: "ceo_md", label: "CEO / MD" },
  ],
};

type StepStatus = "approved" | "pending" | "rejected" | "waiting";

interface Approval {
  approvalLevel: string;
  status: string;
  approver?: { name?: string } | null;
  approverId?: number;
}

interface Props {
  requestType: string;
  currentApprovalLevel?: string | null;
  status: string; // request-level status: draft | pending | approved | rejected
  approvals?: Approval[];
  /** Optional map of role key → display name, e.g. { head_of_department: "G. Agaba" } */
  approverNames?: Record<string, string>;
}

/**
 * Resolves the visual status for each step in the chain.
 */
function resolveStepStatus(
  stepRole: string,
  approvals: Approval[],
  currentApprovalLevel: string | null | undefined,
  requestStatus: string
): StepStatus {
  const approval = approvals.find((a) => a.approvalLevel === stepRole);

  if (approval) {
    if (approval.status === "approved") return "approved";
    if (approval.status === "rejected") return "rejected";
    if (approval.status === "pending") return "pending";
  }

  // If the request is fully approved or rejected, steps without explicit records
  // that come AFTER the current level are either done or irrelevant
  if (requestStatus === "approved") return "approved";
  if (requestStatus === "rejected") return "waiting";

  // If this step's role matches the current approval level, it's pending
  if (currentApprovalLevel === stepRole) return "pending";

  return "waiting";
}

function getStepName(stepRole: string, approvals: Approval[], approverNames?: Record<string, string>): string {
  if (approverNames?.[stepRole]) return approverNames[stepRole];

  const approval = approvals.find((a) => a.approvalLevel === stepRole);
  if (approval?.approver?.name) return approval.approver.name;

  // Fallback labels
  const fallbacks: Record<string, string> = {
    head_of_department: "HOD Office",
    hr: "HR Office",
    head_of_finance: "Finance Office",
    ceo_md: "CEO/MD Office",
  };
  return fallbacks[stepRole] || stepRole.replace(/_/g, " ");
}

const statusConfig: Record<StepStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  approved: {
    label: "approved",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800/50",
    icon: <CheckCircle2 size={14} className="text-green-500" />,
  },
  pending: {
    label: "pending",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800/50",
    icon: <Clock size={14} className="text-amber-500" />,
  },
  rejected: {
    label: "rejected",
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800/50",
    icon: <XCircle size={14} className="text-red-500" />,
  },
  waiting: {
    label: "waiting",
    color: "text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-800/30",
    border: "border-gray-200 dark:border-gray-700/50",
    icon: <Clock size={14} className="text-gray-300" />,
  },
};

export default function ApprovalChainPreview({ requestType, currentApprovalLevel, status, approvals = [], approverNames }: Props) {
  const chain = APPROVAL_CHAINS[requestType];
  if (!chain) return null;

  // Don't show chain for drafts
  if (status === "draft") return null;

  return (
    <div className="w-full">
      {/* Desktop: horizontal chain */}
      <div className="hidden md:flex items-stretch gap-0 w-full">
        {chain.map((step, idx) => {
          const stepStatus = resolveStepStatus(step.role, approvals, currentApprovalLevel, status);
          const cfg = statusConfig[stepStatus];
          const name = getStepName(step.role, approvals, approverNames);

          return (
            <React.Fragment key={step.role}>
              {idx > 0 && (
                <div className="flex items-center px-2 shrink-0">
                  <ArrowRight size={18} className="text-gray-300 dark:text-gray-600" />
                </div>
              )}
              <div
                className={`flex-1 min-w-0 rounded-lg border ${cfg.border} ${cfg.bg} px-4 py-3 transition-all duration-300`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                      {step.label}
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                      {name}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 mt-0.5">
                    {cfg.icon}
                    <span className={`text-[10px] font-bold italic ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: vertical chain */}
      <div className="flex flex-col gap-0 md:hidden">
        {chain.map((step, idx) => {
          const stepStatus = resolveStepStatus(step.role, approvals, currentApprovalLevel, status);
          const cfg = statusConfig[stepStatus];
          const name = getStepName(step.role, approvals, approverNames);

          return (
            <React.Fragment key={step.role}>
              {idx > 0 && (
                <div className="flex justify-center py-1">
                  <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 rotate-90" />
                </div>
              )}
              <div
                className={`rounded-lg border ${cfg.border} ${cfg.bg} px-4 py-3 transition-all duration-300`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                      {step.label}
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                      {name}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {cfg.icon}
                    <span className={`text-[10px] font-bold italic ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
