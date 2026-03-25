import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, RefreshCcw } from "lucide-react";

const returnSchema = z.object({
  conditionAtReturn: z.string().min(1, "Please note the condition of the asset"),
  newStatus: z.enum(["available", "in_maintenance", "retired"]),
});

interface ReturnAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: { id: number; name: string; assetTag: string } | null;
  onSuccess: () => void;
}

const ReturnAssetModal = ({ open, onOpenChange, asset, onSuccess }: ReturnAssetModalProps) => {
  const mutation = trpc.assets.return.useMutation({
    onSuccess: () => {
      toast.success(`Asset returned successfully`);
      onSuccess();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to return asset");
    }
  });

  const form = useForm<z.infer<typeof returnSchema>>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      conditionAtReturn: "",
      newStatus: "available",
    },
  });

  const onSubmit = (values: z.infer<typeof returnSchema>) => {
    if (!asset) return;
    mutation.mutate({
      assetId: asset.id,
      conditionAtReturn: values.conditionAtReturn,
      newStatus: values.newStatus,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-amber-600 p-6 text-white flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl">
             <RefreshCcw size={24} />
          </div>
          <div>
            <DialogTitle className="text-xl font-black">Return Asset</DialogTitle>
            <DialogDescription className="text-amber-100 text-xs mt-1">
              Mark <span className="font-bold text-white underline decoration-amber-300">{asset?.name}</span> ({asset?.assetTag}) as returned.
            </DialogDescription>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5 bg-white dark:bg-slate-900 border-none">
            <FormField
              control={form.control}
              name="conditionAtReturn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Return Condition</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the state of the asset upon return (e.g., 'Minor scratches, missing charger', 'Perfect condition')..." 
                      className="rounded-xl border-slate-200 dark:border-slate-800 min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Post-Return Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11">
                        <SelectValue placeholder="Select next status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="available">Available (Ready for re-assignment)</SelectItem>
                      <SelectItem value="in_maintenance">In Maintenance (Needs repair/service)</SelectItem>
                      <SelectItem value="retired">Retired (End of life / Damaged beyond repair)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-8 shadow-lg shadow-amber-500/20"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  "Confirm Return"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnAssetModal;
