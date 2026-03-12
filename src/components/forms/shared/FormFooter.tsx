import React, { memo } from "react";

/**
 * Shared form footer with Centrika motto and website.
 */
const FormFooter: React.FC = () => {
  return (
    <div className="text-center text-xs text-gray-600 py-3 border-t border-gray-200 space-y-1">
      <p>www.centrika.rw</p>
      <p>1 | Centrika Ltd | Motto: Delivering Tomorrow's Solutions Today</p>
    </div>
  );
};

export default memo(FormFooter);
