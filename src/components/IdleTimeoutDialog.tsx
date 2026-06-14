import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert } from "lucide-react";

interface IdleTimeoutDialogProps {
  open: boolean;
  secondsLeft: number;
  onKeepWorking: () => void;
}

export function IdleTimeoutDialog({ open, secondsLeft, onKeepWorking }: IdleTimeoutDialogProps) {
  const percentage = (secondsLeft / 30) * 100;

  return (
    <Dialog open={open}>
      <DialogContent 
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl"
      >
        <DialogHeader className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 rounded-full animate-pulse">
            <ShieldAlert className="size-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-850 dark:text-white">
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 max-w-xs">
            You have been idle for a while. For your security, your session will expire in{" "}
            <span className="font-semibold text-amber-500 dark:text-amber-400">
              {secondsLeft} seconds
            </span>.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <Progress value={percentage} className="h-2 bg-slate-100 dark:bg-slate-800" />
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button 
            onClick={onKeepWorking}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Keep Working
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
