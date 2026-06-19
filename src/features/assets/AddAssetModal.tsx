import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trpc } from "@/lib/trpc";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import SingleDatePicker from "@/components/SingleDatePicker";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Explicitly define the schema type to avoid inference issues with .default()
const assetSchema = z.object({
  assetTag: z.string().min(1, "Asset Tag is required"),
  name: z.string().min(1, "Asset Name is required"),
  category: z.enum(["it_equipment", "furniture", "vehicles", "software", "other"]),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  purchaseCost: z.string().min(1, "Purchase cost is required"),
  currency: z.string(),
  vendor: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  location: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface AddAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddAssetModal = ({ open, onOpenChange, onSuccess }: AddAssetModalProps) => {
  const mutation = trpc.assets.create.useMutation({
    onSuccess: () => {
      toast.success("Asset registered successfully");
      onSuccess();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register asset");
    }
  });

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      assetTag: "",
      name: "",
      category: "it_equipment",
      purchaseCost: "",
      currency: "RWF",
      purchaseDate: "",
      warrantyExpiry: "",
    },
  });

  const onSubmit = (values: AssetFormValues) => {
    mutation.mutate({
      ...values,
      purchaseCost: Number(values.purchaseCost),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl font-sans">
        <div className="bg-blue-600 p-6 text-white text-center">
          <DialogTitle className="text-xl font-black">Register New Asset</DialogTitle>
          <DialogDescription className="text-blue-100 text-xs mt-1">
            Enter the details to add a new item to the company inventory.
          </DialogDescription>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4 bg-white dark:bg-slate-900 border-none">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assetTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Tag / ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. AST-2026-001" {...field} className="rounded-xl border-slate-200 dark:border-slate-800" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="it_equipment">IT Equipment</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="vehicles">Vehicles</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. MacBook Pro 16-inch" {...field} className="rounded-xl border-slate-200 dark:border-slate-800" />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="S/N: ABC123XYZ" {...field} className="rounded-xl border-slate-200 dark:border-slate-800" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initial Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main Office, Server Room" {...field} className="rounded-xl border-slate-200 dark:border-slate-800" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-slate-100 dark:border-slate-800 py-4 my-2">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Purchase Date</FormLabel>
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
                name="purchaseCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Purchase Cost (RWF)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} className="rounded-xl border-slate-200 dark:border-slate-800" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor / Supplier</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Apple Inc, Simba Supermarket" {...field} className="rounded-xl border-slate-200 dark:border-slate-800" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="warrantyExpiry"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Warranty Expiry</FormLabel>
                    <SingleDatePicker
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

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
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Registering...
                  </>
                ) : (
                  "Register Asset"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetModal;

