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
    <div className={`grid grid-cols-[180px_1fr] border-b border-[#3b6dae]/10 ${doubleRow ? '' : ''}`}>
      <div className="px-5 py-3 font-black bg-[#3b6dae]/5 text-[#3b6dae] text-[9px] uppercase tracking-widest flex items-center border-r border-[#3b6dae]/10">
        {label}
      </div>
      <div className="px-5 py-2 flex items-center bg-white/30">
        {children}
      </div>
    </div>
  );
};

export default memo(FormRow);
