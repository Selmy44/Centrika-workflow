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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, FileUp, Paperclip } from "lucide-react";
import { useState } from "react";

const documentSchema = z.object({
  type: z.enum(["invoice", "warranty", "contract", "photo", "maintenance_report", "other"]),
  fileName: z.string().min(1, "File name is required"),
});

interface AddAssetDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: { id: number; name: string } | null;
  onSuccess: () => void;
}

const AddAssetDocumentModal = ({ open, onOpenChange, asset, onSuccess }: AddAssetDocumentModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mutation = trpc.assets.uploadDocumentBase64.useMutation({
    onSuccess: () => {
      toast.success(`Document uploaded successfully`);
      onSuccess();
      onOpenChange(false);
      resetState();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload document");
      setIsUploading(false);
    }
  });

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: "other",
      fileName: "",
    },
  });

  const resetState = () => {
    form.reset();
    setFile(null);
    setIsUploading(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!form.getValues("fileName")) {
        form.setValue("fileName", selectedFile.name);
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof documentSchema>) => {
    if (!asset || !file) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        mutation.mutate({
          assetId: asset.id,
          type: values.type,
          fileName: values.fileName,
          fileData: base64String,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to process file");
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) resetState();
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-blue-600 p-6 text-white flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl">
             <FileUp size={24} />
          </div>
          <div>
            <DialogTitle className="text-xl font-black">Upload Document</DialogTitle>
            <DialogDescription className="text-blue-100 text-xs mt-1">
              Add a contract, warranty, or invoice for <span className="font-bold text-white uppercase">{asset?.name}</span>.
            </DialogDescription>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5 bg-white dark:bg-slate-900 border-none">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select File</label>
              <div className="relative group">
                <Input 
                  type="file" 
                  onChange={onFileChange}
                  className="hidden" 
                  id="asset-file-upload"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                <label 
                  htmlFor="asset-file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Paperclip className={`w-8 h-8 mb-3 ${file ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500 shadow-sm'}`} />
                    <p className="mb-2 text-xs font-semibold text-slate-500">
                      {file ? file.name : <><span className="text-blue-600 font-bold">Click to upload</span> or drag and drop</>}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">PDF, Word, or Images (Max 10MB)</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="invoice">Invoice / Receipt</SelectItem>
                        <SelectItem value="warranty">Warranty Document</SelectItem>
                        <SelectItem value="contract">Handover Contract</SelectItem>
                        <SelectItem value="maintenance_report">Maintenance Report</SelectItem>
                        <SelectItem value="photo">Asset Photo</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Purchase Invoice 2024" {...field} className="rounded-xl border-slate-200 dark:border-slate-800" />
                    </FormControl>
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
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 shadow-lg shadow-blue-500/20 font-bold"
                disabled={isUploading || mutation.isPending}
              >
                {isUploading || mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetDocumentModal;
