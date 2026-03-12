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
  const titleBg = variant === "yellow" ? "bg-yellow-500" : "bg-blue-600";
  
  return (
    <div>
      {/* ===== HEADER WITH LOGO AND CONTACT INFO ===== */}
      <div className="flex justify-between items-start px-6 py-3 gap-8">
        {/* LEFT: LOGO */}
        <div className="shrink-0">
          <img
            src="/logo/centrikaLogo.png"
            alt="Centrika Logo"
            className="h-20 w-auto"
          />
        </div>

        {/* RIGHT: CONTACT INFO WITH ICONS AND METADATA */}
        <div className="text-sm flex-1 flex flex-col items-end gap-4">
          <div className="flex flex-col gap-2 items-start">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-blue-600" />
              <span className="text-blue-600 font-semibold">+250 788 123 099</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-blue-600" />
              <span className="text-blue-600 font-semibold">info@centrika.rw</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-blue-600" />
              <span className="text-blue-600 font-semibold">www.centrika.rw</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-blue-600 font-semibold">Room F002, 2nd Floor, CHIC Building,</span>
                <span className="text-blue-600 font-semibold">Plot 1007, KN2 Kigali-Rwanda</span>
              </div>
            </div>
          </div>

          {(documentId || status || date) && (
            <div className="flex gap-4 text-[10px] items-center border-t pt-2 w-fit">
              {documentId && (
                <div className="flex flex-col items-end">
                  <span className="text-gray-400 uppercase font-medium">Document ID</span>
                  <span className="font-bold text-blue-900">{documentId}</span>
                </div>
              )}
              {status && (
                <div className="flex flex-col items-end">
                  <span className="text-gray-400 uppercase font-medium">Status</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    status.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' :
                    status.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {status.toUpperCase()}
                  </span>
                </div>
              )}
              {date && (
                <div className="flex flex-col items-end">
                  <span className="text-gray-400 uppercase font-medium">Date</span>
                  <span className="font-bold text-blue-900">{date}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== TITLE BAR ===== */}
      <div className={`${titleBg} text-white text-center font-bold py-2 text-lg tracking-wide shadow-sm`}>
        {title.toUpperCase()}
      </div>
    </div>
  );
};

export default memo(FormHeader);
