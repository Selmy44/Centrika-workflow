import React, { memo } from "react";

interface FormRowProps {
  label: string;
  children: React.ReactNode;
  doubleRow?: boolean;
}

/**
 * Shared form row component with consistent grid layout.
 */
const FormRow: React.FC<FormRowProps> = ({ label, children, doubleRow }) => {
  return (
    <div className={`grid grid-cols-[220px_1fr] border-b border-blue-400 ${doubleRow ? '' : ''}`}>
      <div className="px-3 py-2 font-medium border-r border-blue-400 bg-blue-100 text-blue-700 text-xs">
        {label}
      </div>
      <div className="px-3 py-1">{children}</div>
    </div>
  );
};

export default memo(FormRow);
