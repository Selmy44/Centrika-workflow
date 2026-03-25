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
import SingleDatePicker from "@/components/SingleDatePicker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

const assignSchema = z.object({
  userId: z.string().min(1, "Please select an employee"),
  expectedReturnDate: z.string().optional(),
  conditionAtAssignment: z.string().optional(),
});

type AssignFormValues = z.infer<typeof assignSchema>;

interface AssignAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: { id: number; name: string; assetTag: string } | null;
  onSuccess: () => void;
}

const AssignAssetModal = ({ open, onOpenChange, asset, onSuccess }: AssignAssetModalProps) => {
  const { data: users = [], isLoading: usersLoading } = trpc.users.listAll.useQuery(undefined, {
    enabled: open
  });

  const mutation = trpc.assets.assign.useMutation({
    onSuccess: () => {
      toast.success(`Asset assigned successfully`);
      onSuccess();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign asset");
    }
  });

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      userId: "",
      expectedReturnDate: "",
      conditionAtAssignment: "Good / Working condition",
    },
  });

  const onSubmit = (values: AssignFormValues) => {
    if (!asset) return;
    mutation.mutate({
      assetId: asset.id,
      userId: Number(values.userId),
      expectedReturnDate: values.expectedReturnDate || undefined,
      conditionAtAssignment: values.conditionAtAssignment,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl font-sans">
        <div className="bg-blue-600 p-6 text-white flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl">
             <UserPlus size={24} />
          </div>
          <div>
            <DialogTitle className="text-xl font-black">Assign Asset</DialogTitle>
            <DialogDescription className="text-blue-100 text-xs mt-1">
              Assign <span className="font-bold text-white underline decoration-blue-300">{asset?.name}</span> ({asset?.assetTag}) to an employee.
            </DialogDescription>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5 bg-white dark:bg-slate-900 border-none">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Employee</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11">
                        <SelectValue placeholder={usersLoading ? "Loading employees..." : "Select an employee"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl max-h-[300px]">
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          <div className="flex flex-col text-left">
                            <span className="font-bold">{user.name}</span>
                            <span className="text-[10px] text-slate-400">{user.email} • {user.department?.name || "No Dept"}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedReturnDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expected Return Date (Optional)</FormLabel>
                  <SingleDatePicker
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conditionAtAssignment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Condition Note</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Note the current condition of the asset during handover..." 
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
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 shadow-lg shadow-blue-500/20 font-bold"
                disabled={mutation.isPending || usersLoading}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Assigning...
                  </>
                ) : (
                  "Confirm Assignment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignAssetModal;

