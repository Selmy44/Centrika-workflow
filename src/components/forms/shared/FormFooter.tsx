import React, { memo } from "react";

/**
 * Shared form footer with Centrika motto and website.
 */
const FormFooter: React.FC = () => {
  return (
    <div className="text-center text-[10px] text-[#3b6dae]/50 py-5 border-t border-[#3b6dae]/10 space-y-2 bg-[#c79d2d]/5 font-bold uppercase tracking-widest">
      <p className="hover:text-[#3b6dae] transition-colors cursor-pointer">www.centrika.rw</p>
      <p className="text-[#3b6dae]/30">© 2026 Centrika Ltd • Delivering Tomorrow's Solutions Today</p>
    </div>
  );
};

export default memo(FormFooter);
