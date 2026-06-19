import React, { memo } from "react";
import { Loader2, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FormActionsProps {
  isSubmitting: boolean;
  onSave?: () => void;
  onSubmit?: () => void;
  isApprover?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  isReadOnly?: boolean;
  isRequestApproved?: boolean;
  isRequestRejected?: boolean;
}

/**
 * Shared form actions (Print, Download, Save, Submit, Approve, Reject).
 */
const FormActions: React.FC<FormActionsProps> = ({
  isSubmitting,
  onSave,
  onSubmit,
  isApprover,
  onApprove,
  onReject,
  isReadOnly,
  isRequestApproved,
  isRequestRejected
}) => {
  return (
    <div className="flex justify-between items-center px-8 py-5 border-t border-[#3b6dae]/10 dark:border-[#3b6dae]/30 bg-[#c79d2d]/10 dark:bg-[#2a4365] gap-4 no-print backdrop-blur-md rounded-b-lg">
      {isRequestApproved && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => window.print()}
            className="border-[#3b6dae]/20 text-[#3b6dae] dark:border-[#c79d2d]/20 dark:text-[#c79d2d] dark:hover:bg-[#c79d2d] dark:hover:text-slate-950 font-black text-[10px] tracking-widest uppercase hover:bg-[#3b6dae] hover:text-white transition-all h-9"
          >
            <Printer size={14} className="mr-2" /> Print Doc
          </Button>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => {
              toast.info("Preparing your document for download... Please select 'Save as PDF' in the print menu.");
              setTimeout(() => window.print(), 1000);
            }}
            className="border-[#3b6dae]/20 text-[#3b6dae] dark:border-[#c79d2d]/20 dark:text-[#c79d2d] dark:hover:bg-[#c79d2d] dark:hover:text-slate-950 font-black text-[10px] tracking-widest uppercase hover:bg-[#3b6dae] hover:text-white transition-all h-9"
          >
            <Download size={14} className="mr-2" /> Export PDF
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        {isApprover && !isReadOnly ? (
          <>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={onReject}
              className="border-rose-400 text-rose-600 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50 hover:bg-rose-50 font-black text-[10px] tracking-widest uppercase h-9 shadow-none"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={onApprove}
              className="bg-[#3b6dae] hover:bg-[#2d5385] dark:bg-[#c79d2d] dark:hover:bg-[#e6c55e] dark:text-slate-950 font-black text-[10px] tracking-widest uppercase h-9 shadow-lg dark:shadow-none"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve Request
            </Button>
          </>
        ) : !isReadOnly && !isRequestApproved && !isRequestRejected ? (
          <>
            {onSave && (
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={onSave}
                className="border-[#3b6dae]/20 text-[#3b6dae] dark:border-[#c79d2d]/20 dark:text-[#c79d2d] dark:hover:bg-[#c79d2d] dark:hover:text-slate-950 font-black text-[10px] tracking-widest uppercase h-9 shadow-none hover:bg-white dark:bg-[#1f426b]"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Draft
              </Button>
            )}
            {onSubmit && (
              <Button
                disabled={isSubmitting}
                onClick={onSubmit}
                className="bg-[#3b6dae] hover:bg-[#2d5385] dark:bg-[#c79d2d] dark:hover:bg-[#e6c55e] dark:text-slate-950 font-black text-[10px] tracking-widest uppercase h-9 shadow-lg dark:shadow-none"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default memo(FormActions);
