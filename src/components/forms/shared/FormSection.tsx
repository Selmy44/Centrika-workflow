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
    <div className={`grid grid-cols-1 md:grid-cols-[180px_1fr] border-b border-[#3b6dae]/10 dark:border-[#3b6dae]/30 ${false ? '' : ''}`}>
      <div className="px-3 md:px-5 py-1.5 md:py-3 font-black bg-[#3b6dae]/5 dark:bg-[#295482]/50 text-[#3b6dae] dark:text-[#c79d2d] text-[9px] uppercase tracking-widest flex items-center md:border-r border-[#3b6dae]/10 dark:border-[#3b6dae]/30">
        {title.toUpperCase()}
      </div>
      <div className="px-3 md:px-8 py-3 md:py-6">
        {children}
      </div>
    </div>
  );
};

export default memo(FormSection);
