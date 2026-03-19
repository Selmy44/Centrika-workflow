import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Filter, CheckCircle, XCircle, Download, Eye, CheckCheck, Users, ShieldAlert } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormatter";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const DocumentCenterPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const utils = trpc.useContext();
  const { data: documents = [], isLoading } = trpc.hr.listAllDocuments.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    category: categoryFilter === "all" ? undefined : categoryFilter,
  });

  const verifyMutation = trpc.hr.verifyDocument.useMutation({
    onSuccess: () => {
      toast.success("Document status updated successfully");
      utils.hr.listAllDocuments.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update document status");
    },
  });

  const filteredDocs = useMemo(
    () =>
      documents.filter((doc: any) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [documents, searchTerm]
  );

  const categories = Array.from(new Set(documents.map((doc: any) => doc.category).filter(Boolean)));
  const pendingDocs = documents.filter((doc: any) => doc.status === "pending");
  const verifiedDocs = documents.filter((doc: any) => doc.status === "verified");
  const rejectedDocs = documents.filter((doc: any) => doc.status === "rejected");

  const visiblePendingIds = filteredDocs.filter((doc: any) => doc.status === "pending").map((doc: any) => doc.id);

  const handleVerify = async (id: number, status: "verified" | "rejected") => {
    await verifyMutation.mutateAsync({ documentId: id, status });
    setSelectedIds((current) => current.filter((item) => item !== id));
  };

  const handleBulkUpdate = async (status: "verified" | "rejected") => {
    if (!selectedIds.length) {
      toast.error("Select at least one document first");
      return;
    }

    try {
      await Promise.all(selectedIds.map((id) => verifyMutation.mutateAsync({ documentId: id, status })));
      toast.success(`${selectedIds.length} documents updated`);
      setSelectedIds([]);
    } catch {
      // Mutation toasts already handle the error state.
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleSelectAllVisible = () => {
    const allSelected = visiblePendingIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((current) => current.filter((id) => !visiblePendingIds.includes(id)));
      return;
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...visiblePendingIds])));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">HR Document Center</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Review employee records, verify documentation, and clear the compliance queue faster.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={toggleSelectAllVisible}>
              <CheckCheck size={16} className="mr-2" /> {visiblePendingIds.length && visiblePendingIds.every((id) => selectedIds.includes(id)) ? "Clear Visible" : "Select Visible Pending"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Review</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{pendingDocs.length}</p>
              <p className="mt-1 text-xs text-slate-500">Documents still waiting for verification</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verified</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{verifiedDocs.length}</p>
              <p className="mt-1 text-xs text-slate-500">Employee records approved</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rejected</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{rejectedDocs.length}</p>
              <p className="mt-1 text-xs text-slate-500">Records requiring employee follow-up</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bulk Selection</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{selectedIds.length}</p>
              <p className="mt-1 text-xs text-slate-500">Pending documents selected for action</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card className="rounded-2xl border-border/50 bg-white/50 backdrop-blur-sm">
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="relative min-w-[250px] flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    placeholder="Search by employee, document, category, or department..."
                    className="rounded-xl border-border/50 pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <select className="cursor-pointer bg-transparent text-sm font-medium focus:outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Documents</option>
                    <option value="pending">Pending Verification</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <select className="cursor-pointer rounded-xl border border-border/50 bg-white px-3 py-2 text-sm dark:bg-slate-900" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {!!selectedIds.length && (
              <Card className="rounded-2xl border-blue-200/60 bg-blue-50/80 shadow-sm dark:border-blue-900/40 dark:bg-slate-900/60">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedIds.length} pending documents selected</p>
                    <p className="text-xs text-slate-500">Apply the same decision across the selected review queue.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-xl border-emerald-300 text-emerald-600" onClick={() => handleBulkUpdate("verified")} disabled={verifyMutation.isPending}>
                      <CheckCircle size={16} className="mr-2" /> Bulk Verify
                    </Button>
                    <Button variant="outline" className="rounded-xl border-rose-300 text-rose-600" onClick={() => handleBulkUpdate("rejected")} disabled={verifyMutation.isPending}>
                      <XCircle size={16} className="mr-2" /> Bulk Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Pick</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Document & User</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Submitted</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Verifier</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {isLoading ? (
                      [1, 2, 3].map((i) => (
                        <tr key={i}>
                          <td colSpan={7} className="px-6 py-8 animate-pulse"><div className="h-4 w-full rounded bg-slate-100" /></td>
                        </tr>
                      ))
                    ) : filteredDocs.length ? (
                      filteredDocs.map((doc: any) => (
                        <tr key={doc.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-4">
                            {doc.status === "pending" ? (
                              <input type="checkbox" checked={selectedIds.includes(doc.id)} onChange={() => toggleSelection(doc.id)} className="h-4 w-4 rounded border-slate-300" />
                            ) : null}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                                <FileText size={20} />
                              </div>
                              <div>
                                <p className="max-w-[220px] truncate text-sm font-bold text-slate-800 dark:text-white">{doc.name}</p>
                                <p className="text-[10px] font-medium text-slate-500">
                                  Owner: {doc.user.name} · {doc.user.department?.name || "No department"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">{doc.category}</td>
                          <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(doc.createdAt)}</td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                doc.status === "verified"
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                                  : doc.status === "rejected"
                                    ? "border-rose-500/20 bg-rose-500/10 text-rose-600"
                                    : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                              }
                            >
                              {doc.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">{doc.verifier?.name || "N/A"}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/admin/employees/${doc.user.id}`}>
                                <Button variant="ghost" size="sm" title="Open Employee Profile" className="h-8 w-8 p-0">
                                  <Users size={16} className="text-slate-400" />
                                </Button>
                              </Link>
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" title="View Document" className="h-8 w-8 p-0">
                                  <Eye size={16} className="text-slate-400" />
                                </Button>
                              </a>
                              {doc.status === "pending" && (
                                <>
                                  <Button variant="ghost" size="sm" title="Verify" className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50" onClick={() => handleVerify(doc.id, "verified")}>
                                    <CheckCircle size={16} />
                                  </Button>
                                  <Button variant="ghost" size="sm" title="Reject" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50" onClick={() => handleVerify(doc.id, "rejected")}>
                                    <XCircle size={16} />
                                  </Button>
                                </>
                              )}
                              <a href={doc.fileUrl} download>
                                <Button variant="ghost" size="sm" title="Download" className="h-8 w-8 p-0">
                                  <Download size={16} className="text-slate-400" />
                                </Button>
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm italic text-slate-500">
                          No documents found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Compliance Guidance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-amber-600">
                    <ShieldAlert size={14} />
                    <p className="text-xs font-bold uppercase tracking-widest">Queue Health</p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{pendingDocs.length} documents are still pending validation and should be reviewed promptly.</p>
                </div>
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">Recommended Flow</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Verify identity and contract records first, then resolve rejections by checking the employee profile for context.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentCenterPage;
