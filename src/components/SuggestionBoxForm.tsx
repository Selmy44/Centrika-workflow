import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, User, Users, X } from "lucide-react";
import { toast } from "sonner";
import { StaffSelector } from "./StaffSelector";
import { useAuth } from "@/_core/hooks/useAuth";

export function SuggestionBoxForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [targetUserIds, setTargetUserIds] = useState<number[]>([]);
  const [attachments, setAttachments] = useState<{ fileName: string, fileUrl: string, fileKey: string, mimeType?: string, fileSize?: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const commonEmojis = ["😊", "👍", "🔥", "❤️", "📍", "📅", "✅", "💡", "🚀", "📢", "🤝", "🙏"];

  const uploadMutation = trpc.requests.uploadAttachment.useMutation();

  const submitMutation = trpc.suggestions.submit.useMutation({
    onSuccess: () => {
      setContent("");
      setTitle("");
      setTargetUserIds([]);
      setAttachments([]);
      onSuccess?.();
      toast.success("Message Sent", {
        description: (
          <span className="text-[#3b6dae] dark:text-blue-400 font-medium font-black uppercase tracking-tighter">
            Your communication has been securely sent to recipients.
          </span>
        ),
      });
    },
    onError: (err) => {
      toast.error("Send Failed", {
        description: err.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || targetUserIds.length === 0 || submitMutation.isPending) return;
    submitMutation.mutate({
      title: title.trim() || undefined,
      content,
      targetUserIds,
      attachments: attachments.length > 0 ? attachments : undefined
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (const file of Array.from(files)) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const base64 = await base64Promise;
        const result = await (uploadMutation as any).mutateAsync({
          fileName: file.name,
          fileData: base64.split(',')[1],
          mimeType: file.type
        });

        setAttachments(prev => [...prev, {
          fileName: file.name,
          fileUrl: result.fileUrl || result.url,
          fileKey: result.fileKey || result.key || `chat-${Date.now()}`,
          mimeType: file.type,
          fileSize: file.size
        }]);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setIsUploading(false);
  };

  return (
    <div className="relative group/feedback">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Routing Selection */}
        <div className="space-y-4 px-1">
          {targetUserIds.length > 1 && (
            <div className="flex items-center gap-4 animate-in slide-in-from-top-2">
              <div className="w-10 h-10 rounded-2xl bg-[#3b6dae]/5 flex items-center justify-center text-[#3b6dae] shrink-0">
                <Users size={18} />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this group a name (optional)..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-black text-[#3b6dae] placeholder:text-slate-300 placeholder:font-bold"
              />
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#3b6dae]/5 flex items-center justify-center text-[#3b6dae] shrink-0">
              <User size={18} />
            </div>
            <div className="flex-1 space-y-2">
              <StaffSelector
                selectedStaffIds={targetUserIds}
                onChange={setTargetUserIds}
              />
            </div>
          </div>
        </div>

        <div className="relative">
          <Textarea
            id="suggestion"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message, support request, or feedback here..."
            className="w-full bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 focus:border-[#3b6dae]/30 focus:ring-4 focus:ring-[#3b6dae]/5 rounded-[2rem] p-6 min-h-[140px] text-sm font-medium placeholder:text-slate-400 placeholder:font-bold placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px] resize-none transition-all duration-300 shadow-inner"
          />

          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="absolute bottom-4 left-6 right-6 flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 p-2 rounded-2xl">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">{file.fileName}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {/* Emoji Picker Popover */}
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-10 h-10 rounded-xl hover:bg-[#3b6dae]/5 text-slate-400 hover:text-[#3b6dae] transition-all"
              >
                😊
              </Button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-wrap gap-1 w-[200px] z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
                  {commonEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setContent(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Media Upload Button */}
            <label className="cursor-pointer">
              <div className="w-10 h-10 rounded-xl hover:bg-[#3b6dae]/5 text-slate-400 hover:text-[#3b6dae] transition-all flex items-center justify-center">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users size={18} />}
              </div>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            className="bg-[#3b6dae] hover:bg-[#2d5385] text-white font-black text-xs uppercase tracking-[0.2em] px-10 py-6 rounded-2xl shadow-2xl shadow-[#3b6dae]/20 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
            disabled={!content.trim() || targetUserIds.length === 0 || submitMutation.isPending || isUploading}
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-3">
                SEND <Send size={16} strokeWidth={3} />
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
