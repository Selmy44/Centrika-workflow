import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Stethoscope, FileText, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

type LeaveType = "annual" | "sick" | "unpaid" | "parental";

interface LeaveTypeSelectorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelectLeaveType: (type: LeaveType) => void;
}

const leaveTypes = [
  {
    id: "annual" as LeaveType,
    name: "Annual Leave",
    description: "Regular vacation",
    icon: Calendar,
    color: "from-[#3b6dae] to-[#2d5385] dark:from-[#c79d2d] dark:to-[#d6ae45] dark:text-slate-950",
    bgColor: "bg-[#3b6dae]/5 dark:bg-[#295482]/50",
    borderColor: "border-[#3b6dae]/10 dark:border-[#132c4a]",
    iconBg: "bg-[#3b6dae]/10 dark:bg-[#326191]/80",
    iconColor: "text-[#3b6dae] dark:text-[#c79d2d]",
  },
  {
    id: "sick" as LeaveType,
    name: "Sick Leave",
    description: "Leave due to illness",
    icon: Stethoscope,
    color: "from-[#3b6dae] to-[#2d5385] dark:from-[#c79d2d] dark:to-[#d6ae45] dark:text-slate-950",
    bgColor: "bg-[#3b6dae]/5 dark:bg-[#295482]/50",
    borderColor: "border-[#3b6dae]/10 dark:border-[#132c4a]",
    iconBg: "bg-[#3b6dae]/10 dark:bg-[#326191]/80",
    iconColor: "text-[#3b6dae] dark:text-[#c79d2d]",
  },
  {
    id: "parental" as LeaveType,
    name: "Parental Leave",
    description: "Paternity or maternity leave",
    icon: FileText,
    color: "from-[#3b6dae] to-[#2d5385] dark:from-[#c79d2d] dark:to-[#d6ae45] dark:text-slate-950",
    bgColor: "bg-[#3b6dae]/5 dark:bg-[#295482]/50",
    borderColor: "border-[#3b6dae]/10 dark:border-[#132c4a]",
    iconBg: "bg-[#3b6dae]/10 dark:bg-[#326191]/80",
    iconColor: "text-[#3b6dae] dark:text-[#c79d2d]",
  },
  {
    id: "unpaid" as LeaveType,
    name: "Unpaid Leave",
    description: "Unpaid leave",
    icon: XCircle,
    color: "from-[#3b6dae] to-[#2d5385] dark:from-[#c79d2d] dark:to-[#d6ae45] dark:text-slate-950",
    bgColor: "bg-[#3b6dae]/5 dark:bg-[#295482]/50",
    borderColor: "border-[#3b6dae]/10 dark:border-[#132c4a]",
    iconBg: "bg-[#3b6dae]/10 dark:bg-[#326191]/80",
    iconColor: "text-[#3b6dae] dark:text-[#c79d2d]",
  },
];

export function LeaveTypeSelector({
  open,
  onOpenChange,
  onSelectLeaveType,
}: LeaveTypeSelectorProps) {
  const handleSelect = (type: LeaveType) => {
    onSelectLeaveType(type);
  };

  const id = "leave-category";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-96! max-h-125! p-0! gap-0! overflow-hidden! dark:bg-[#1f426b] dark:border-[#132c4a]" style={{ height: "auto" }} showCloseButton={false}>
        <Button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full w-9 h-9 p-0 flex items-center justify-center bg-[#3b6dae] hover:bg-[#2d5385] dark:bg-[#326191] dark:hover:bg-slate-700 dark:text-slate-200 text-white z-10 transition-all shadow-lg"
        >
          ✕
        </Button>
        <DialogHeader className="space-y-2 pb-3 border-b border-[#3b6dae]/10 dark:border-[#132c4a] px-6 pt-6 pr-14 bg-[#c79d2d]/10 dark:bg-[#1a385c]/80">
          <DialogTitle className="text-xl font-black bg-linear-to-r from-[#3b6dae] to-[#2d5385] dark:from-[#c79d2d] dark:to-[#e6c55e] bg-clip-text text-transparent">
            Select Leave Type
          </DialogTitle>
          <Label htmlFor={id} className="text-[9px] font-black text-[#3b6dae]/60 dark:text-[#c79d2d]/70 uppercase tracking-widest pl-0.5">
            CHOOSE THE DEPARTMENTAL LEAVE CATEGORY
          </Label>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex items-center justify-center bg-white dark:bg-[#1f426b]">
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {leaveTypes.map((leave) => {
              const Icon = leave.icon;

              return (
                <Card
                  key={leave.id}
                  className={`cursor-pointer transition-all duration-200 border-2 flex flex-col ${leave.borderColor} ${leave.bgColor} hover:dark:border-[#c79d2d]/50 hover:shadow-md dark:shadow-none hover:dark:bg-[#295482]`}
                  onClick={() => handleSelect(leave.id)}
                >
                  <CardContent className="pt-3 pb-3 flex flex-col h-full">
                    <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                      {/* Icon */}
                      <div className={`p-1.5 rounded-full ${leave.iconBg}`}>
                        <Icon className={`${leave.iconColor} w-3.5 h-3.5`} />
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-xs text-gray-900 dark:text-slate-200 line-clamp-2">
                        {leave.name}
                      </h3>

                      {/* Button */}
                      <Button
                        className={`w-full font-semibold transition-colors duration-200 text-white text-xs h-6 mt-1 bg-linear-to-r ${leave.color}`}
                        onClick={() => handleSelect(leave.id)}
                      >
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
}
