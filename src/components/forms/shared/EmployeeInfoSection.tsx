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
          className="border-[#3b6dae]/20 h-8 text-[11px] bg-[#c79d2d]/5 cursor-not-allowed !text-[#3b6dae] font-black"
          disabled
        />
      </FormRow>
      <FormRow label="1.2 Date of Employment">
        <Input
          type="date"
          value={dateOfEmployment}
          className="border-[#3b6dae]/20 h-8 text-[11px] bg-[#c79d2d]/5 cursor-not-allowed !text-[#3b6dae] font-black"
          disabled
        />
      </FormRow>
      <FormRow label="1.3 Staff ID">
        <Input
          value={staffId}
          className="border-[#3b6dae]/20 h-8 text-[11px] bg-[#c79d2d]/5 cursor-not-allowed !text-[#3b6dae] font-black"
          disabled
        />
      </FormRow>
      <FormRow label="1.4 Department">
        <Input
          value={department}
          className="border-[#3b6dae]/20 h-8 text-[11px] bg-[#c79d2d]/5 cursor-not-allowed !text-[#3b6dae] font-black"
          disabled
        />
      </FormRow>
      <FormRow label="1.5 Position / Title">
        <Input
          value={position}
          className="border-[#3b6dae]/20 h-8 text-[11px] bg-[#c79d2d]/5 cursor-not-allowed !text-[#3b6dae] font-black"
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
            <SelectTrigger className="h-8 border-[#3b6dae]/20 bg-white text-[11px] font-black">
              <SelectValue placeholder="Select department head" />
            </SelectTrigger>
            <SelectContent>
              {heads.map((head: any) => (
                <SelectItem key={head.id} value={head.id.toString()} className="text-xs">
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
