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
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "sick" as LeaveType,
    name: "Sick Leave",
    description: "Leave due to illness",
    icon: Stethoscope,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    id: "parental" as LeaveType,
    name: "Parental Leave",
    description: "Paternity or maternity leave",
    icon: FileText,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    id: "unpaid" as LeaveType,
    name: "Unpaid Leave",
    description: "Unpaid leave",
    icon: XCircle,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-96 !max-h-[500px] !p-0 !gap-0 !overflow-hidden" style={{ height: "auto" }}>
        <Button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full w-9 h-9 p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white z-10"
        >
          ✕
        </Button>
        <DialogHeader className="space-y-2 pb-3 border-b px-6 pt-6 pr-14">
          <DialogTitle className="text-xl font-bold bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Select Leave Type
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-600">
            Choose the type of leave you want to request
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {leaveTypes.map((leave) => {
              const Icon = leave.icon;

              return (
                <Card
                  key={leave.id}
                  className={`cursor-pointer transition-all duration-200 border-2 flex flex-col ${leave.borderColor} ${leave.bgColor}`}
                  onClick={() => handleSelect(leave.id)}
                >
                  <CardContent className="pt-3 pb-3 flex flex-col h-full">
                    <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                      {/* Icon */}
                      <div className={`p-1.5 rounded-full ${leave.iconBg}`}>
                        <Icon className={`${leave.iconColor} w-3.5 h-3.5`} />
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-xs text-gray-900 line-clamp-2">
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
