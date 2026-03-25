import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowLeft,
  ClipboardList,
  History as HistoryIcon,
  FileText,
  Wrench,
  Trash2,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ExternalLink,
  Loader2,
  Tag,
  ShieldCheck,
  MapPin
} from "lucide-react";
import LogMaintenanceModal from "./LogMaintenanceModal";
import AddAssetDocumentModal from "./AddAssetDocumentModal";
import { formatDateTime } from "@/lib/dateFormatter";
import { useState } from "react";

const AssetDetailsPage = () => {
  const params = useParams();
  const id = Number(params.id);

  const { data: asset, isLoading, error, refetch } = trpc.assets.getDetails.useQuery({ id: Number(params.id) });
  const [activeTab, setActiveTab] = useState<"history" | "documents" | "maintenance" | "audit">("history");

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !asset) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <p className="text-rose-500 font-bold">Error loading asset details.</p>
          <Link href="/assets">
            <Button variant="link">Back to Registry</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3">Available</Badge>;
      case "assigned":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-3">Assigned</Badge>;
      case "in_maintenance":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3">In Maintenance</Badge>;
      default:
        return <Badge className="px-3">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-8 animate-in fade-in duration-500 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/assets">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white uppercase">
                  {asset.name}
                </h1>
                {getStatusBadge(asset.status)}
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-1 font-medium italic">
                <Tag size={12} /> {asset.assetTag} • {asset.category.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl border-border/50">Edit Details</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Info Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 py-4 border-b border-border/30">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Current Assignment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {asset.assignments?.[0] && asset.assignments[0].status === 'active' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-black text-white">
                        {asset.assignments[0].user?.name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-white">{asset.assignments[0].user?.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{asset.assignments[0].user?.position}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Assigned Date</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 italic">{formatDateTime(asset.assignments[0].assignedAt)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Due Return</span>
                        <span className="font-bold text-amber-600 italic">{asset.assignments[0].expectedReturnDate ? formatDateTime(asset.assignments[0].expectedReturnDate) : "Open-ended"}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm italic text-slate-400 font-medium">Currently Available in Inventory</p>
                    <Button variant="outline" size="sm" className="mt-4 rounded-xl text-blue-600 border-blue-100 hover:bg-blue-50">Assign to Staff</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
               <CardHeader className="bg-slate-50 dark:bg-slate-800/50 py-4 border-b border-border/30">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Purchasing Info</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={14} className="text-slate-400" />
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bought On</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{new Date(asset.purchaseDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Tag size={14} className="text-slate-400" />
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cost</p>
                      <p className="font-black text-blue-600 underline">
                        {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(Number(asset.purchaseCost))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <ShieldCheck size={14} className="text-slate-400" />
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Warranty</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 italic">{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : "No Warranty Info"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed View Hub */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="history" className="w-full space-y-6">
              <TabsList className="w-full rounded-2xl border border-border/30 bg-slate-100 p-1 dark:bg-slate-800/50">
                <TabsTrigger value="history" className="flex-1 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 transition-all">
                  <HistoryIcon size={14} className="mr-2" /> Assignment History
                </TabsTrigger>
                <TabsTrigger value="docs" className="flex-1 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 transition-all">
                  <FileText size={14} className="mr-2" /> Documents
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="flex-1 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 transition-all">
                  <Wrench size={14} className="mr-2" /> Maintenance
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex-1 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 transition-all">
                  <Clock size={14} className="mr-2" /> Audit log
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history">
                <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Returned Condition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {asset.assignments.map((as: any) => (
                          <tr key={as.id} className="text-sm italic">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800 dark:text-white uppercase">{as.user?.name}</p>
                              <p className="text-[10px] text-slate-400">ID: {as.user?.staffId}</p>
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {new Date(as.assignedAt).toLocaleDateString()} to {as.returnedAt ? new Date(as.returnedAt).toLocaleDateString() : 'Present'}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={as.status === 'active' ? 'default' : 'outline'} className="text-[10px] font-black uppercase tracking-wider">
                                {as.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                              {as.conditionAtReturn || as.conditionAtAssignment || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="docs" className="space-y-4">
                <div className="flex justify-end">
                   <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-dashed"
            onClick={() => setShowDocumentModal(true)}
          >
            <Plus size={14} className="mr-2" /> Add Document
          </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {asset.documents.length ? asset.documents.map((doc: any) => (
                    <Card key={doc.id} className="rounded-xl border-border/50 hover:border-blue-500/30 transition-colors cursor-pointer group shadow-none">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 dark:text-white truncate uppercase">{doc.fileName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{doc.type} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Download size={16} className="text-slate-400 group-hover:text-blue-600" />
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="col-span-2 py-12 text-center text-sm italic text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-border/30 rounded-3xl">
                      No documents stored for this asset.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4">
                <div className="flex justify-end">
                   <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-dashed"
            onClick={() => setShowMaintenanceModal(true)}
          >
            <Plus size={14} className="mr-2" /> Log Maintenance
          </Button>
                </div>
                <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-white dark:bg-slate-900 border-none">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left italic">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Service Description</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Cost</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Logged By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {asset.maintenance.length ? asset.maintenance.map((m: any) => (
                          <tr key={m.id}>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                              {new Date(m.maintenanceDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-xs max-w-xs truncate font-medium text-slate-800 dark:text-white uppercase transition-all hover:whitespace-normal">
                              {m.description}
                            </td>
                            <td className="px-6 py-4 text-sm font-black text-rose-600 text-right underline decoration-rose-300">
                               {new Intl.NumberFormat('en-RW').format(Number(m.cost))}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 font-bold italic">
                              {m.logger?.name}
                            </td>
                          </tr>
                        )) : (
                           <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-sm italic text-slate-500 font-black uppercase tracking-widest">
                               No maintenance history found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="audit">
                 <Card className="rounded-2xl border-border/50 shadow-sm bg-white dark:bg-slate-900 p-6">
                    <div className="space-y-6">
                      {asset.auditLogs.map((log: any, i: number) => (
                        <div key={log.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-blue-600 after:absolute after:left-[3px] after:top-6 after:h-[calc(100%-16px)] after:w-[1px] after:bg-slate-200 dark:after:bg-slate-800 last:after:hidden">
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{log.action}</p>
                          <p className="text-xs text-slate-500 mt-1 italic">{log.details}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDateTime(log.createdAt)}</span>
                             <span className="text-[10px] font-bold text-blue-600 italic underline decoration-blue-200">by {log.user?.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                 </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

      <LogMaintenanceModal
        open={showMaintenanceModal}
        onOpenChange={setShowMaintenanceModal}
        asset={asset ? { id: asset.id, name: asset.name } : null}
        onSuccess={refetch}
      />

      <AddAssetDocumentModal
        open={showDocumentModal}
        onOpenChange={setShowDocumentModal}
        asset={asset ? { id: asset.id, name: asset.name } : null}
        onSuccess={refetch}
      />
    </div>
    </DashboardLayout>
  );
};

export default AssetDetailsPage;
