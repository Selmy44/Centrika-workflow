import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LeaveTypeSelector } from "@/components/LeaveTypeSelector";
import LeaveRequestForm from "@/components/forms/LeaveRequestForm";
import CarRequestForm from "@/components/forms/CarRequestForm";
import ExpenditureRequestForm from "@/components/forms/ExpenditureRequestForm";

type RequestType = "leave" | "car" | "expenditure";
type LeaveType = "annual" | "sick" | "personal" | "unpaid" | "parental";

interface CreateRequestDialogProps {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  initialRequestType?: RequestType;
}

export function CreateRequestDialog({
  open = false,
  onOpenChange,
  initialRequestType = "leave",
}: CreateRequestDialogProps) {
  const [showLeaveSelector, setShowLeaveSelector] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);

  // When the main dialog opens and it's a leave request, show selector
  useEffect(() => {
    if (open && initialRequestType === "leave") {
      setShowLeaveSelector(true);
      setShowFormDialog(false);
    } else if (open && initialRequestType !== "leave") {
      setShowLeaveSelector(false);
      setShowFormDialog(true);
    }
  }, [open, initialRequestType]);

  const handleLeaveTypeSelect = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setShowLeaveSelector(false);
    setShowFormDialog(true);
  };

  const handleBackToLeaveSelector = () => {
    setShowFormDialog(false);
    setShowLeaveSelector(true);
  };

  const handleCloseAll = () => {
    setShowLeaveSelector(false);
    setShowFormDialog(false);
    setSelectedLeaveType(null);
    onOpenChange?.(false);
  };

  const handleSuccess = () => {
    handleCloseAll();
  };

  return (
    <>
      {/* Leave Type Selector Modal */}
      <LeaveTypeSelector
        open={showLeaveSelector}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseAll();
          }
        }}
        onSelectLeaveType={handleLeaveTypeSelect}
      />

      {/* Leave Request Form Dialog */}
      {initialRequestType === "leave" && selectedLeaveType && (
        <Dialog open={showFormDialog} onOpenChange={handleCloseAll}>
          <DialogContent
            className="!w-[85vw] !max-w-[85vw] !max-h-[85vh] !overflow-y-auto !p-0 !flex !flex-col !gap-0"
            style={{ width: "85vw", maxWidth: "85vw" }}
            onInteractOutside={(e) => e.preventDefault()}
            showCloseButton={false}
          >
            <div className="flex-1 overflow-y-auto w-full">
              <LeaveRequestForm
                onSuccess={handleSuccess}
                leaveType={selectedLeaveType}
                onBack={handleBackToLeaveSelector}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Car Request Form Dialog */}
      {initialRequestType === "car" && (
        <Dialog open={showFormDialog} onOpenChange={handleCloseAll}>
          <DialogContent
            className="!w-[85vw] !max-w-[85vw] !max-h-[85vh] !overflow-y-auto !p-0 !flex !flex-col !gap-0"
            style={{ width: "85vw", maxWidth: "85vw" }}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <div className="flex-1 overflow-y-auto w-full">
              <CarRequestForm onSuccess={handleSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Expenditure Request Form Dialog */}
      {initialRequestType === "expenditure" && (
        <Dialog open={showFormDialog} onOpenChange={handleCloseAll}>
          <DialogContent
            className="!w-[85vw] !max-w-[85vw] !max-h-[85vh] !overflow-y-auto !p-0 !flex !flex-col !gap-0"
            style={{ width: "85vw", maxWidth: "85vw" }}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <div className="flex-1 overflow-y-auto w-full">
              <ExpenditureRequestForm onSuccess={handleSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
