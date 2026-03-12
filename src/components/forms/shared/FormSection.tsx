import React, { memo } from "react";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  variant?: "blue" | "yellow";
}

/**
 * Shared section component with colored header and border.
 */
const FormSection: React.FC<FormSectionProps> = ({ title, children, variant = "blue" }) => {
  const headerBg = variant === "blue" ? "bg-blue-500" : "bg-yellow-500";
  const borderColor = variant === "blue" ? "border-blue-400" : "border-yellow-400";

  return (
    <div className={`border-t ${borderColor}`}>
      <div className={`${headerBg} text-white font-bold px-4 py-2 text-sm`}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
};

export default memo(FormSection);
