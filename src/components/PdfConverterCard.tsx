import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface PdfConverterCardProps {
  documents: any[];
  isLoading?: boolean;
}

export const PdfConverterCard: React.FC<PdfConverterCardProps> = ({
  documents,
  isLoading = false,
}) => {
  const [converting, setConverting] = useState<number | null>(null);
  const [convertedDocs, setConvertedDocs] = useState<Map<number, string>>(
    new Map()
  );
  const [progress, setProgress] = useState(0);

  const convertMutation = (trpc as any).hr.convertDocumentToPdf.useMutation();
  const bulkConvertMutation =
    (trpc as any).hr.generateBulkDocumentsPdf.useMutation();

  const handleConvertSingle = async (docId: number) => {
    setConverting(docId);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 30;
        });
      }, 200);

      const result = await convertMutation.mutateAsync({
        documentId: docId,
        includeMetadata: true,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        // Create download link
        const link = document.createElement("a");
        link.href = `data:${result.mimeType};base64,${result.buffer}`;
        link.download = result.fileName;
        link.click();

        setConvertedDocs(new Map(convertedDocs).set(docId, result.fileName));
        toast.success(`✨ ${result.fileName} ready for download!`);

        setTimeout(() => {
          setConverting(null);
          setProgress(0);
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || "Conversion failed");
      setConverting(null);
      setProgress(0);
    }
  };

  const handleConvertAll = async () => {
    if (documents.length === 0) {
      toast.error("No documents to convert");
      return;
    }

    setConverting(-1); // Bulk conversion indicator
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 25;
        });
      }, 200);

      const result = await bulkConvertMutation.mutateAsync({
        documentIds: documents.map((d) => d.id),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        const link = document.createElement("a");
        link.href = `data:${result.mimeType};base64,${result.buffer}`;
        link.download = result.fileName;
        link.click();

        toast.success(
          `🎉 Bulk export complete! ${result.documentCount} documents converted.`
        );

        setTimeout(() => {
          setConverting(null);
          setProgress(0);
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || "Bulk conversion failed");
      setConverting(null);
      setProgress(0);
    }
  };

  const isConverting = converting !== null;
  const successCount = convertedDocs.size;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-[#3b6dae]/20 rounded-2xl shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#3b6dae] to-blue-600 text-white py-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isConverting ? 360 : 0 }}
            transition={{ duration: isConverting ? 1 : 0, repeat: isConverting ? Infinity : 0 }}
          >
            <Zap size={24} className="text-yellow-300" />
          </motion.div>
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-tight">
              🚀 PDF Converter
            </CardTitle>
            <p className="text-blue-100 text-xs mt-1">
              Transform your documents into beautiful PDFs
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Info Box */}
        {!isConverting && successCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200"
          >
            <CheckCircle2 size={20} className="text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold text-green-900">Success!</p>
              <p className="text-green-800 text-xs">
                {successCount} document{successCount > 1 ? "s" : ""} converted to PDF
              </p>
            </div>
          </motion.div>
        )}

        {/* Progress Section */}
        {isConverting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#3b6dae]" />
                <span className="text-sm font-bold text-[#3b6dae]">
                  {converting === -1 ? "Converting all documents..." : "Converting document..."}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-slate-200" />

            {/* Animated conversion visualization */}
            <motion.div
              className="flex items-center justify-center gap-2 py-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="h-8 w-8 rounded-lg bg-[#3b6dae]/20 flex items-center justify-center"
              >
                <FileText size={16} className="text-[#3b6dae]" />
              </motion.div>
              <motion.div
                animate={{ x: [0, 20, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <Zap size={16} className="text-yellow-500" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center"
              >
                <FileText size={16} className="text-indigo-600" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isConverting && documents.length === 0 && (
          <div className="text-center py-6">
            <div className="flex justify-center mb-3">
              <AlertCircle className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              No documents to convert
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Upload documents in the section above to get started
            </p>
          </div>
        )}

        {/* Document List & Conversion Controls */}
        {!isConverting && documents.length > 0 && (
          <>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {documents.map((doc: any, idx: number) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-[#3b6dae]/10 hover:bg-white hover:border-[#3b6dae]/20 transition-all group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-[#3b6dae]/10 flex items-center justify-center text-[#3b6dae] shrink-0">
                      {convertedDocs.has(doc.id) ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <FileText size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#3b6dae] truncate">
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {doc.category.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>

                  {!convertedDocs.has(doc.id) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-[10px] font-black uppercase bg-[#3b6dae] text-white hover:bg-[#2d5385] rounded-lg shrink-0"
                      onClick={() => handleConvertSingle(doc.id)}
                      disabled={isConverting}
                    >
                      <Zap size={12} className="mr-1" />
                      Convert
                    </Button>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 text-green-600"
                    >
                      <CheckCircle2 size={14} />
                      <span className="text-[9px] font-bold uppercase">Done</span>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[#3b6dae]/10">
              <Button
                onClick={handleConvertAll}
                disabled={isConverting || documents.length === 0}
                className="flex-1 bg-gradient-to-r from-[#3b6dae] to-blue-600 hover:from-[#2d5385] hover:to-blue-700 text-white font-black uppercase text-xs h-10 rounded-lg gap-2"
              >
                <Zap size={14} />
                Convert All ({documents.length})
              </Button>

              {successCount > 0 && (
                <Button
                  variant="outline"
                  className="gap-2 text-[#3b6dae] border-[#3b6dae]/30 hover:bg-[#3b6dae]/5 font-bold uppercase text-xs"
                  onClick={() => {
                    setConvertedDocs(new Map());
                    toast.success("Conversion history cleared");
                  }}
                >
                  <Download size={14} />
                  Clear
                </Button>
              )}
            </div>

            {/* Stats Footer */}
            <div className="pt-3 border-t border-[#3b6dae]/10 flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Total Documents: {documents.length}</span>
              {successCount > 0 && <span className="text-green-600">✓ {successCount} Converted</span>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
