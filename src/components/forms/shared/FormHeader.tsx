import React, { memo } from "react";
import { Phone, Mail, Globe, MapPin } from "lucide-react";

interface FormHeaderProps {
  title: string;
  variant?: "blue" | "yellow";
  documentId?: string;
  status?: string;
  date?: string;
}

/**
 * Shared form header with Centrika logo, contact details, and title bar.
 */
const FormHeader: React.FC<FormHeaderProps> = ({ 
  title, 
  variant = "yellow",
  documentId,
  status,
  date
}) => {
  const titleBg = "bg-linear-to-r from-[#3b6dae] to-[#2d5385]";
  
  return (
    <div className="bg-[#FFFAE8]">
      {/* ===== HEADER WITH LOGO AND CONTACT INFO ===== */}
      <div className="flex justify-between items-start px-8 py-5 gap-8">
        {/* LEFT: LOGO */}
        <div className="shrink-0">
          <img
            src="/logo/centrikaLogo.png"
            alt="Centrika Logo"
            className="h-24 w-auto drop-shadow-sm"
          />
        </div>

        {/* RIGHT: CONTACT INFO WITH ICONS AND METADATA */}
        <div className="text-xs flex-1 flex flex-col items-end gap-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-[#3b6dae] font-black tracking-tight">+250 788 123 099</span>
              <div className="p-1 bg-[#3b6dae]/5 rounded">
                <Phone size={12} className="text-[#3b6dae]" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-[#3b6dae] font-black tracking-tight">info@centrika.rw</span>
              <div className="p-1 bg-[#3b6dae]/5 rounded">
                <Mail size={12} className="text-[#3b6dae]" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-[#3b6dae] font-black tracking-tight">www.centrika.rw</span>
              <div className="p-1 bg-[#3b6dae]/5 rounded">
                <Globe size={12} className="text-[#3b6dae]" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className="flex flex-col text-right">
                <span className="text-[#3b6dae] font-black tracking-tight">Kigali, Rwanda</span>
              </div>
              <div className="p-1 bg-[#3b6dae]/5 rounded">
                <MapPin size={12} className="text-[#3b6dae]" />
              </div>
            </div>
          </div>

          {(documentId || status || date) && (
            <div className="flex gap-6 text-[9px] items-center border-t border-[#3b6dae]/10 pt-3 w-fit">
              {documentId && (
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 uppercase font-black tracking-widest">Document ID</span>
                  <span className="font-black text-[#3b6dae]">{documentId}</span>
                </div>
              )}
              {status && (
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 uppercase font-black tracking-widest">Status</span>
                  <span className={`font-black px-2 py-0.5 rounded text-[8px] ${
                    status.toLowerCase() === 'approved' ? 'bg-[#3b6dae]/10 text-[#3b6dae]' :
                    status.toLowerCase() === 'rejected' ? 'bg-rose-100 text-rose-600' :
                    'bg-[#c79d2d]/20 text-[#3b6dae]'
                  }`}>
                    {status.toUpperCase()}
                  </span>
                </div>
              )}
              {date && (
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 uppercase font-black tracking-widest">Date Issued</span>
                  <span className="font-black text-[#3b6dae]">{date}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== TITLE BAR ===== */}
      <div className={`${titleBg} text-white text-center font-black py-3 text-sm tracking-[0.2em] shadow-lg border-y border-[#c79d2d]/20`}>
        {title.toUpperCase()}
      </div>
    </div>
  );
};

export default memo(FormHeader);
