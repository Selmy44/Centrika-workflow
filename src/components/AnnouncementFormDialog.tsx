import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function AnnouncementFormDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const utils = trpc.useContext();

  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => {
      utils.announcements.list.invalidate();
      setOpen(false);
      setTitle("");
      setContent("");
    },
    onError: (error) => {
      console.error("Failed to create announcement:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createMutation.mutate({ title, content });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
           size="sm" 
           variant="ghost" 
           className="h-7 px-2 text-[10px] font-bold text-[#3b6dae] hover:bg-[#3b6dae]/10 rounded-lg flex items-center gap-1 uppercase tracking-widest"
        >
          <PlusCircle size={12} />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-50 dark:bg-slate-900 border-none rounded-3xl p-0 overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-48 h-48 bg-[#3b6dae]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#c79d2d]/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
         
        <DialogHeader className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border/50 p-6 relative z-10 transition-colors">
          <DialogTitle className="text-xl font-black text-[#3b6dae] dark:text-blue-400">Post Announcement</DialogTitle>
          <p className="text-xs text-slate-500 font-medium">Create a new pinned memo for your department or company.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#3b6dae] uppercase tracking-widest ml-1">Memo Title</label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Townhall Update"
              className="bg-white/50 dark:bg-slate-800/50 border-border/50 focus-visible:ring-[#3b6dae] focus-visible:border-[#3b6dae] rounded-xl font-medium"
              required
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-[#3b6dae] uppercase tracking-widest ml-1">Message Content</label>
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the full body of the announcement..."
              className="min-h-[120px] bg-white/50 dark:bg-slate-800/50 border-border/50 focus-visible:ring-[#3b6dae] focus-visible:border-[#3b6dae] rounded-xl resize-none font-medium custom-scrollbar"
              required
              disabled={createMutation.isPending}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button 
               type="button" 
               variant="ghost" 
               onClick={() => setOpen(false)}
               className="text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl px-6 font-bold"
               disabled={createMutation.isPending}
            >
              CANCEL
            </Button>
            <Button 
               type="submit" 
               className="bg-gradient-to-r from-[#3b6dae] to-[#2d5385] hover:from-[#2d5385] hover:to-[#1e3a5f] text-white rounded-xl shadow-lg shadow-blue-900/20 px-8 font-black tracking-wide"
               disabled={createMutation.isPending || !title.trim() || !content.trim()}
            >
              {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "POST MEMO"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
