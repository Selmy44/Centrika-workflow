import { Button } from "@/components/ui/button";
import { RequestIcon } from "@/components/shared/RequestIcon";
import { useState } from "react";
import { CreateRequestDialog } from "@/components/CreateRequestDialog";
import { Plus, ArrowRight } from "lucide-react";

export const QuickActions = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"leave" | "car" | "expenditure" | "asset">("leave");

  const actions = [
    { type: "leave", title: "Leave", label: "Book Time Off" },
    { type: "car", title: "Transport", label: "Request Car" },
    { type: "expenditure", title: "Expense", label: "Claim Funds" },
    { type: "asset", title: "Asset", label: "Req Equipment" },
  ];

  const handleCreate = (type: "leave" | "car" | "expenditure" | "asset") => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "leave": return "bg-blue-500/10 text-blue-500 dark:text-blue-400";
      case "car": return "bg-[#3b6dae] text-white shadow-[0_4px_12px_rgba(59,109,174,0.3)]";
      case "expenditure": return "bg-green-500/10 text-green-500 dark:text-green-400";
      case "asset": return "bg-orange-500/10 text-orange-500 dark:text-orange-400";
      default: return "bg-slate-500/10 text-slate-500";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {actions.map((action) => (
        <button
          key={action.type}
          onClick={() => handleCreate(action.type as any)}
          className="group relative flex flex-col items-center justify-center p-2 bg-white/60 dark:bg-slate-800/80 border border-border/40 dark:border-white/20 rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#3b6dae]/5 overflow-hidden shadow-sm"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3b6dae]/5 to-[#c79d2d]/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-1.5">
            <div className={`p-1.5 rounded-xl transition-all duration-500 shadow-inner group-hover:scale-110 group-hover:rotate-6 ${getIconColor(action.type)}`}>
              <RequestIcon type={action.type} size={14} className={action.type === 'car' ? 'text-white' : ''} />
            </div>
            
            <div className="space-y-0.5">
              <p className="text-[11px] font-black text-[#3b6dae] dark:text-[#c79d2d] uppercase tracking-wider mb-0.5">
                {action.title}
              </p>
              <p className="text-[8px] font-bold text-slate-400 dark:text-slate-400/40 uppercase tracking-[0.15em] leading-none">
                {action.label}
              </p>
            </div>
          </div>

          <div className="absolute top-2.5 right-2.5 p-1 transition-all duration-500 scale-100 group-hover:scale-110">
            <div className="bg-[#c79d2d] rounded-full p-1 text-white shadow-md border-2 border-white dark:border-slate-900 group-hover:bg-[#d8ae3a]">
              <Plus size={8} strokeWidth={5} />
            </div>
          </div>
        </button>
      ))}
      <CreateRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} initialRequestType={dialogType} />
    </div>
  );
};
