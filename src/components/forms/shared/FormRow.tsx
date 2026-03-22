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
    <div className={`grid grid-cols-[180px_1fr] border-b border-[#3b6dae]/10 dark:border-[#3b6dae]/30 ${doubleRow ? '' : ''}`}>
      <div className="px-5 py-3 font-black bg-[#3b6dae]/5 dark:bg-[#295482]/50 text-[#3b6dae] dark:text-[#c79d2d] text-[9px] uppercase tracking-widest flex items-center border-r border-[#3b6dae]/10 dark:border-[#3b6dae]/30">
        {label}
      </div>
      <div className="px-5 py-2 flex items-center bg-white dark:bg-[#1f426b] dark:text-slate-300">
        {children}
      </div>
    </div>
  );
};

export default memo(FormRow);
