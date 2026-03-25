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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SingleDatePicker from "@/components/SingleDatePicker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Wrench } from "lucide-react";

const maintenanceSchema = z.object({
  maintenanceDate: z.string().min(1, "Maintenance date is required"),
  cost: z.string().min(1, "Maintenance cost is required"),
  vendor: z.string().optional(),
  description: z.string().min(5, "Please provide a detailed description of the work done"),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

interface LogMaintenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: { id: number; name: string } | null;
  onSuccess: () => void;
}

const LogMaintenanceModal = ({ open, onOpenChange, asset, onSuccess }: LogMaintenanceModalProps) => {
  const mutation = trpc.assets.logMaintenance.useMutation({
    onSuccess: () => {
      toast.success(`Maintenance logged successfully`);
      onSuccess();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log maintenance");
    }
  });

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      maintenanceDate: "",
      cost: "",
      vendor: "",
      description: "",
    },
  });

  const onSubmit = (values: MaintenanceFormValues) => {
    if (!asset) return;
    mutation.mutate({
      assetId: asset.id,
      maintenanceDate: values.maintenanceDate,
      cost: Number(values.cost),
      vendor: values.vendor,
      description: values.description,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl font-sans">
        <div className="bg-slate-800 p-6 text-white flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl">
             <Wrench size={24} />
          </div>
          <div>
            <DialogTitle className="text-xl font-black">Log Maintenance</DialogTitle>
            <DialogDescription className="text-slate-300 text-xs mt-1">
              Record service or repair details for <span className="font-bold text-white uppercase">{asset?.name}</span>.
            </DialogDescription>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5 bg-white dark:bg-slate-900 border-none">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maintenanceDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Date</FormLabel>
                    <SingleDatePicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cost (RWF)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} className="rounded-xl border-slate-200 dark:border-slate-800" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Provider / Vendor</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. IT Service Hub, Toyota Rwanda" {...field} className="rounded-xl border-slate-200 dark:border-slate-800" />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description of Work</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Details of what was repaired or serviced..." 
                      className="rounded-xl border-slate-200 dark:border-slate-800 min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
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
                className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-8 shadow-lg shadow-slate-500/20 font-bold"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Entry"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LogMaintenanceModal;
