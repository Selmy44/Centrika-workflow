import React, { memo } from "react";

interface FormContainerProps {
  children: React.ReactNode;
  onClose?: () => void;
  onBack?: () => void;
  maxWidth?: string;
}

/**
 * Shared container for forms with a close/back button and standard padding.
 */
const FormContainer: React.FC<FormContainerProps> = ({
  children,
  onClose,
  onBack,
  maxWidth = "max-w-4xl",
}) => {
  return (
    <div className="w-full bg-white text-black px-4 leave-form-container relative print:p-0">
      {/* CLOSE/BACK BUTTON */}
      {(onClose || onBack) && (
        <button
          onClick={() => (onBack ? onBack() : onClose?.())}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition no-print"
          title="Close form"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className={`${maxWidth} mx-auto py-4 print:py-0`}>
        {children}
      </div>
    </div>
  );
};

export default memo(FormContainer);
