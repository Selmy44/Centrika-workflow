import React, { memo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import FormSection from "./FormSection";
import FormRow from "./FormRow";

interface EmployeeInfoSectionProps {
  employeeName: string;
  staffId: string;
  department: string;
  position: string;
  dateOfEmployment: string;
  reportingManager: string;
  onManagerChange?: (value: string) => void;
  heads: any[];
  isReadOnly?: boolean;
}

/**
 * Shared section for Employee Personal Information (1.x).
 */
const EmployeeInfoSection: React.FC<EmployeeInfoSectionProps> = ({
  employeeName,
  staffId,
  department,
  position,
  dateOfEmployment,
  reportingManager,
  onManagerChange,
  heads,
  isReadOnly = false,
}) => {
  return (
    <FormSection title="1. EMPLOYEE INFORMATION">
      <FormRow label="1.1 Employee Full Name">
        <Input
          value={employeeName}
          className="border-[#3b6dae]/20 dark:border-[#2b6cb0]/30 h-8 text-[11px] bg-[#c79d2d]/5 dark:bg-[#2a4365]/50 cursor-not-allowed !text-[#3b6dae] dark:!text-[#c79d2d] font-black shadow-none focus-visible:ring-0 opacity-100"
          disabled
        />
      </FormRow>
      <FormRow label="1.2 Date of Employment">
        <Input
          type="date"
          value={dateOfEmployment}
          className="border-[#3b6dae]/20 dark:border-[#2b6cb0]/30 h-8 text-[11px] bg-[#c79d2d]/5 dark:bg-[#2a4365]/50 cursor-not-allowed !text-[#3b6dae] dark:!text-[#c79d2d] font-black shadow-none focus-visible:ring-0 opacity-100"
          disabled
        />
      </FormRow>
      <FormRow label="1.3 Staff ID">
        <Input
          value={staffId}
          className="border-[#3b6dae]/20 dark:border-[#2b6cb0]/30 h-8 text-[11px] bg-[#c79d2d]/5 dark:bg-[#2a4365]/50 cursor-not-allowed !text-[#3b6dae] dark:!text-[#c79d2d] font-black shadow-none focus-visible:ring-0 opacity-100"
          disabled
        />
      </FormRow>
      <FormRow label="1.4 Department">
        <Input
          value={department}
          className="border-[#3b6dae]/20 dark:border-[#2b6cb0]/30 h-8 text-[11px] bg-[#c79d2d]/5 dark:bg-[#2a4365]/50 cursor-not-allowed !text-[#3b6dae] dark:!text-[#c79d2d] font-black shadow-none focus-visible:ring-0 opacity-100"
          disabled
        />
      </FormRow>
      <FormRow label="1.5 Position / Title">
        <Input
          value={position}
          className="border-[#3b6dae]/20 dark:border-[#2b6cb0]/30 h-8 text-[11px] bg-[#c79d2d]/5 dark:bg-[#2a4365]/50 cursor-not-allowed !text-[#3b6dae] dark:!text-[#c79d2d] font-black shadow-none focus-visible:ring-0 opacity-100"
          disabled
        />
      </FormRow>

      {onManagerChange && (
        <FormRow label="1.6 Reporting Manager / HOD *">
          <Select 
            value={reportingManager} 
            onValueChange={onManagerChange}
            disabled={isReadOnly}
          >
            <SelectTrigger className="h-8 border-[#3b6dae]/20 dark:border-[#2b6cb0]/30 bg-white dark:bg-[#1f426b] text-[11px] font-black dark:text-[#c79d2d] shadow-none">
              <SelectValue placeholder="Select department head" />
            </SelectTrigger>
            <SelectContent className="dark:bg-[#1a365d] dark:border-[#2b6cb0]/30">
              {heads.map((head: any) => (
                <SelectItem key={head.id} value={head.id.toString()} className="text-xs dark:focus:bg-slate-900 dark:focus:text-white">
                  {head.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
      )}
    </FormSection>
  );
};

export default memo(EmployeeInfoSection);
