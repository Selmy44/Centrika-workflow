import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormatter";

interface WorkflowTrackerProps {
  currentStatus: string;
  approvalLogs: any[];
}

export function WorkflowTracker({ currentStatus, approvalLogs }: WorkflowTrackerProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-6 flex items-center gap-2">
        <Clock size={16} className="text-blue-500" />
        Live Approval Progress
      </h3>
      
      <div className="relative flex flex-col">
        {approvalLogs.map((step, index) => {
          const isCompleted = step.status === "approved" || step.status === "rejected";
          const date = step.approvalDate || step.updatedAt;
          
          // Calculate time spent if we have a previous step or creation date
          let timeSpent = "";
          if (isCompleted || step.status === "pending") {
            const startTime = index === 0 
              ? new Date(step.request?.createdAt || new Date()).getTime() 
              : new Date(approvalLogs[index-1].approvalDate || approvalLogs[index-1].updatedAt).getTime();
            const endTime = isCompleted ? new Date(date).getTime() : Date.now();
            const diffHrs = (endTime - startTime) / (1000 * 60 * 60);
            
            if (diffHrs < 1) timeSpent = `${Math.max(0, Math.round(diffHrs * 60))}m`;
            else if (diffHrs < 24) timeSpent = `${Math.round(diffHrs)}h`;
            else timeSpent = `${Math.round(diffHrs / 24)}d`;
          }

          return (
            <div key={step.id || index} className="flex items-start gap-4 group">
              <div className="flex flex-col items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${
                  step.status === "approved" ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200" :
                  step.status === "rejected" ? "bg-rose-500 border-rose-500 text-white shadow-rose-200" :
                  step.status === "pending" ? "bg-white border-blue-500 text-blue-500 animate-pulse shadow-blue-100" :
                  "bg-white border-slate-200 text-slate-300"
                }`}>
                  {step.status === "approved" ? <CheckCircle2 className="h-5 w-5" /> : 
                   step.status === "rejected" ? <XCircle className="h-5 w-5" /> :
                   <div className="h-2 w-2 rounded-full bg-current" />}
                </div>
                {index < approvalLogs.length - 1 && (
                  <div className={`w-0.5 h-12 ${step.status === "approved" ? "bg-emerald-500" : "bg-slate-100"}`} />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {step.approvalLevel?.replace(/_/g, ' ').toUpperCase() || "STEP"}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      {step.approver?.name || "System"}
                      {timeSpent && <span className="text-[10px] bg-slate-100 px-1.5 rounded-full font-medium ml-1 text-slate-600">Spent: {timeSpent}</span>}
                    </p>
                  </div>
                  {date && (
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      {formatDateTime(date)}
                    </span>
                  )}
                </div>
                {step.comments && (
                  <div className="mt-2 text-xs text-slate-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 italic leading-relaxed">
                    "{step.comments}"
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {(currentStatus === "rejected" || currentStatus === "cancelled") && (
        <div className={`mt-4 p-3 rounded-xl text-center text-xs font-medium border ${
          currentStatus === "rejected" ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-slate-50 border-slate-100 text-slate-600"
        }`}>
          {currentStatus === "rejected" ? "This request has been rejected." : "This request has been cancelled."}
        </div>
      )}
    </div>
  );
}
