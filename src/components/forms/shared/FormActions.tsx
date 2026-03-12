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
    <div className="flex justify-between items-center px-6 py-4 border-t border-blue-400 bg-gray-50 gap-4 no-print">
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={isSubmitting}
          onClick={() => window.print()}
          className="border-blue-400 text-blue-600"
        >
          <Printer size={16} className="mr-1" /> Print
        </Button>
        <Button
          variant="outline"
          disabled={isSubmitting}
          onClick={() => {
            toast.info("Download functionality requires backend PDF generation");
          }}
          className="border-blue-400 text-blue-600"
        >
          <Download size={16} className="mr-1" /> Download
        </Button>
      </div>

      <div className="flex gap-2">
        {isApprover && !isReadOnly ? (
          <>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={onReject}
              className="border-red-400 text-red-600 hover:bg-red-50"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </>
        ) : !isReadOnly && !isRequestApproved && !isRequestRejected ? (
          <>
            {onSave && (
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={onSave}
                className="border-blue-400"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Draft
              </Button>
            )}
            {onSubmit && (
              <Button
                disabled={isSubmitting}
                onClick={onSubmit}
                className="bg-blue-600 hover:bg-blue-700"
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
