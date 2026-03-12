import { FileText, Download, Image as ImageIcon, File, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/dateFormatter";
import { useState } from "react";

interface FileReviewComponentProps {
  title: string;
  files: any[];
  showSignatures?: boolean;
  employeeSignature?: any;
  managerSignature?: any;
  remainingDays?: number;
}

export function FileReviewComponent({
  title,
  files,
  showSignatures = false,
  employeeSignature,
  managerSignature,
  remainingDays,
}: FileReviewComponentProps) {
  const [previewFile, setPreviewFile] = useState<any>(null);

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileText size={20} className="text-gray-400" />;
    if (mimeType.includes("image")) return <ImageIcon size={20} className="text-blue-400" />;
    if (mimeType.includes("pdf")) return <FileText size={20} className="text-red-400" />;
    return <File size={20} className="text-gray-400" />;
  };

  const isImage = (mimeType?: string) => mimeType?.includes("image");
  const isPdf = (mimeType?: string) => mimeType?.includes("pdf");

  return (
    <div className="space-y-4">
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee Signature Section */}
          {showSignatures && employeeSignature && (
            <div className="p-4 rounded border border-blue-500/30 bg-blue-950/20 space-y-3">
              <h4 className="font-semibold text-white">Employee Signature</h4>
              <div className="flex gap-3 items-center">
                {isImage(employeeSignature.mimeType) ? (
                  <div className="p-2 rounded border border-gray-600 bg-gray-900/50">
                    <img
                      src={employeeSignature.fileUrl}
                      alt="Employee Signature"
                      className="h-16 object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-2 rounded border border-gray-600 bg-gray-900/50">
                    <FileText className="text-red-400" size={32} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{employeeSignature.fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Uploaded: {formatDateTime(employeeSignature.createdAt)}
                  </p>
                </div>
                <a href={employeeSignature.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-blue-500/30">
                    <Download size={16} className="mr-1" />
                    View
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* Leave Balance Info */}
          {remainingDays !== undefined && (
            <div className="p-3 rounded border border-green-500/30 bg-green-950/20">
              <p className="text-sm text-gray-300">
                Remaining Leave Days: <span className="font-bold text-green-300">{remainingDays}</span>
              </p>
            </div>
          )}

          {/* Manager/Approver Signature Section */}
          {showSignatures && managerSignature && (
            <div className="p-4 rounded border border-purple-500/30 bg-purple-950/20 space-y-3">
              <h4 className="font-semibold text-white">Manager/Approver Signature</h4>
              <div className="flex gap-3 items-center">
                {isImage(managerSignature.mimeType) ? (
                  <div className="p-2 rounded border border-gray-600 bg-gray-900/50">
                    <img
                      src={managerSignature.fileUrl}
                      alt="Manager Signature"
                      className="h-16 object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-2 rounded border border-gray-600 bg-gray-900/50">
                    <FileText className="text-red-400" size={32} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{managerSignature.fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Uploaded: {formatDateTime(managerSignature.createdAt)}
                  </p>
                </div>
                <a href={managerSignature.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-purple-500/30">
                    <Download size={16} className="mr-1" />
                    View
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* Supporting Documents Section */}
          {files && files.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Supporting Documents</h4>
              <div className="space-y-2">
                {files.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded border border-gray-700 bg-gray-900/30 hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file.mimeType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{file.fileName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {file.mimeType || "Unknown type"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2 shrink-0">
                      {isImage(file.mimeType) && (
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Download size={14} />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <FileText className="mx-auto mb-2 text-gray-600" size={32} />
              <p className="text-sm">No supporting documents uploaded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewFile?.fileName}</DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              {previewFile?.mimeType || "Unknown type"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center">
            {previewFile && isImage(previewFile.mimeType) && (
              <img src={previewFile.fileUrl} alt={previewFile.fileName} className="max-w-full max-h-[70vh] object-contain rounded" />
            )}
            {previewFile && isPdf(previewFile.mimeType) && (
              <iframe
                src={previewFile.fileUrl}
                className="w-full h-[70vh] rounded border border-gray-700"
                title={previewFile.fileName}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <a href={previewFile?.fileUrl} download={previewFile?.fileName} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <Download size={14} className="mr-1" />
                Download
              </Button>
            </a>
            <Button size="sm" variant="outline" onClick={() => setPreviewFile(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
