import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormatter";
import { useAuth } from "@/_core/hooks/useAuth";

interface RequestMessagingProps {
  requestId: number;
}

export function RequestMessaging({ requestId }: RequestMessagingProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const utils = trpc.useContext();

  const { data: comments, isLoading } = trpc.comments.getComments.useQuery({ requestId });
  
  const addCommentMutation = trpc.comments.addComment.useMutation({
    onSuccess: () => {
      setContent("");
      utils.comments.getComments.invalidate({ requestId });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || addCommentMutation.isPending) return;
    addCommentMutation.mutate({ requestId, content });
  };

  return (
    <Card className="mt-8 border-slate-200">
      <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
          <MessageSquare size={16} />
          Discussion Thread
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-slate-400" />
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm italic">No comments yet. Start the conversation!</p>
            </div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.profileImage || ""} />
                  <AvatarFallback className="bg-slate-200 text-[10px]">
                    {comment.user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900">{comment.user.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(comment.createdAt)}
                    </span>
                    {comment.user.role !== "user" && (
                      <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                        {comment.user.role.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              className="resize-none min-h-[40px] text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="shrink-0 bg-blue-600 hover:bg-blue-700"
              disabled={!content.trim() || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-slate-400 mt-2">
            Tip: Press Enter to send, Shift + Enter for new line.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
