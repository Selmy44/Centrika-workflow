import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Send, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SuggestionBoxForm() {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);

  const submitMutation = trpc.suggestions.submit.useMutation({
    onSuccess: () => {
      setContent("");
      toast.success("Suggestion Submitted", {
        description: "Thank you for your feedback! It helps us improve.",
      });
    },
    onError: (err) => {
      toast.error("Submission Failed", {
        description: err.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitMutation.isPending) return;
    submitMutation.mutate({ content, isAnonymous });
  };

  return (
    <div className="relative group/feedback">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Textarea
            id="suggestion"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What should we improve? Your voice is anonymous..."
            className="w-full bg-white/50 dark:bg-slate-900/40 border-border/40 focus:border-[#3b6dae]/30 focus:ring-0 rounded-[1.5rem] p-4 min-h-[140px] text-sm font-medium placeholder:text-slate-400 placeholder:font-bold placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px] resize-none transition-all duration-300"
          />
          <div className="absolute top-4 right-4 text-[#3b6dae]/20 group-focus-within/feedback:text-[#3b6dae]/40 transition-colors">
             <ShieldCheck size={18} strokeWidth={2.5} />
          </div>
        </div>
        
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 group/anon cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
            <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isAnonymous ? 'bg-[#3b6dae]' : 'bg-slate-200'}`}>
               <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isAnonymous ? 'left-4.5' : 'left-0.5'}`} />
            </div>
            <button className="text-[10px] font-bold text-[#c79d2d] flex items-center gap-1 hover:text-[#3b6dae] transition-all bg-transparent border-none">
              Identity Hidden
            </button>
          </div>
          
          <Button 
            type="submit" 
            size="sm"
            className="bg-[#3b6dae] hover:bg-[#3b6dae]/90 text-white font-black text-[10px] uppercase tracking-widest px-4 py-4 rounded-xl shadow-lg shadow-[#3b6dae]/10 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
            disabled={!content.trim() || submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                Beam Suggestion <Send size={12} strokeWidth={3} />
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
