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
          className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
          disabled
        />
      </FormRow>
      <FormRow label="1.2 Date of Employment">
        <Input
          type="date"
          value={dateOfEmployment}
          className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
          disabled
        />
      </FormRow>
      <FormRow label="1.3 Staff ID">
        <Input
          value={staffId}
          className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
          disabled
        />
      </FormRow>
      <FormRow label="1.4 Department">
        <Input
          value={department}
          className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
          disabled
        />
      </FormRow>
      <FormRow label="1.5 Position / Title">
        <Input
          value={position}
          className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
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
            <SelectTrigger className="h-7 border-blue-300 bg-white text-xs">
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
