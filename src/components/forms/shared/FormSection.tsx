import React, { memo } from "react";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  variant?: "blue" | "yellow";
}

/**
 * Shared section component with colored header and border.
 */
const FormSection: React.FC<FormSectionProps> = ({ title, children }) => {
  const headerBg = "bg-[#3b6dae]";
  const borderColor = "border-[#3b6dae]/20";

  return (
    <div className={`grid grid-cols-[180px_1fr] border-b border-[#3b6dae]/10 ${false ? '' : ''}`}>
      <div className="px-5 py-3 font-black bg-[#3b6dae]/5 text-[#3b6dae] text-[9px] uppercase tracking-widest flex items-center border-r border-[#3b6dae]/10">
        {title.toUpperCase()}
      </div>
      <div className="px-8 py-6">
        {children}
      </div>
    </div>
  );
};

export default memo(FormSection);
