/**
 * ApprovalRoutePreview
 *
 * A clean, professional preview of the approval chain shown on draft/unsubmitted
 * forms so employees know exactly who will review their request before they submit.
 * Intentionally has no status badges — it simply shows the route.
 */

interface RouteStep {
  /** 1-3 character abbreviation displayed inside the avatar circle */
  initials: string;
  /** Primary label — usually a name or role */
  name: string;
  /** Secondary label — the role/title */
  role: string;
  /** Marks the submitter's node with a green colour instead of blue */
  isSubmitter?: boolean;
}

interface ApprovalRoutePreviewProps {
  steps: RouteStep[];
}

export function ApprovalRoutePreview({ steps }: ApprovalRoutePreviewProps) {
  return (
    <div className="px-4 py-5">
      {/* Divider with centred title */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-100 to-blue-200/60 dark:via-[#3b6dae]/15 dark:to-[#3b6dae]/25" />
        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] shrink-0 select-none">
          Approval Route Preview
        </p>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-blue-100 to-blue-200/60 dark:via-[#3b6dae]/15 dark:to-[#3b6dae]/25" />
      </div>

      {/* Step chain */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1 sm:gap-2">
            {/* Avatar + label */}
            <div className="flex flex-col items-center text-center w-[62px]">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold border-2 shadow-sm ${
                  step.isSubmitter
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-700/40 dark:text-emerald-400"
                    : "bg-[#3b6dae]/10 border-[#3b6dae]/30 text-[#3b6dae] dark:bg-[#1a385c]/30 dark:border-[#3b6dae]/40 dark:text-blue-300"
                }`}
              >
                {step.initials}
              </div>
              <p className="text-[10px] font-semibold text-gray-700 dark:text-slate-300 mt-1.5 leading-tight break-words line-clamp-2 w-full">
                {step.name}
              </p>
              <p className="text-[8px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">
                {step.role}
              </p>
            </div>

            {/* Arrow connector */}
            {i < steps.length - 1 && (
              <div className="flex items-center pb-5 shrink-0">
                <div className="w-4 h-px bg-gray-200 dark:bg-gray-700" />
                <div
                  className="w-0 h-0"
                  style={{
                    borderTop: "3.5px solid transparent",
                    borderBottom: "3.5px solid transparent",
                    borderLeft: "5px solid #d1d5db",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-4 italic">
        ✏ Signatures will be collected once this request is submitted
      </p>
    </div>
  );
}
