import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Filter, 
  Laptop, 
  Car, 
  Armchair, 
  Monitor, 
  MoreVertical,
  UserPlus,
  History,
  Wrench,
  RefreshCcw
} from "lucide-react";
import { formatDateTime } from "@/lib/dateFormatter";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import AddAssetModal from "./AddAssetModal";
import AssignAssetModal from "./AssignAssetModal";
import ReturnAssetModal from "./ReturnAssetModal";
import LogMaintenanceModal from "./LogMaintenanceModal";

const AssetsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: assets = [], isLoading } = trpc.assets.list.useQuery({
    status: statusFilter === "all" ? undefined : (statusFilter as any),
    category: categoryFilter === "all" ? undefined : (categoryFilter as any),
    searchTerm: searchTerm || undefined,
  });

  const { data: stats } = trpc.assets.getStats.useQuery();

  const handleRefresh = () => {
    utils.assets.list.invalidate();
    utils.assets.getStats.invalidate();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "it_equipment": return <Laptop size={16} className="text-blue-500" />;
      case "vehicles": return <Car size={16} className="text-orange-500" />;
      case "furniture": return <Armchair size={16} className="text-green-500" />;
      default: return <Monitor size={16} className="text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Available</Badge>;
      case "assigned":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Assigned</Badge>;
      case "in_maintenance":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">In Maintenance</Badge>;
      case "retired":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Retired</Badge>;
      case "lost":
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20">Lost</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-8 animate-in fade-in duration-500 font-sans">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Asset Registry</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Track, manage, and audit all company equipment and resources.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 w-full sm:w-auto"
            >
              <Plus size={18} className="mr-2" /> Add New Asset
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card className="relative rounded-2xl border-border/50 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Assets</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{stats?.totalAssets ?? 0}</p>
              <div className="mt-2 flex items-center text-xs text-slate-500">
                <span className="font-bold text-blue-600 mr-1">Total Value:</span>
                {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(stats?.totalValue ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card className="relative rounded-2xl border-border/50 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Available</p>
              <p className="mt-2 text-3xl font-black text-emerald-600">{(stats?.totalAssets ?? 0) - (stats?.assignedCount ?? 0)}</p>
              <p className="mt-1 text-xs text-slate-500">Ready for assignment</p>
            </CardContent>
          </Card>
          <Card className="relative rounded-2xl border-border/50 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Assigned</p>
              <p className="mt-2 text-3xl font-black text-blue-600">{stats?.assignedCount ?? 0}</p>
              <p className="mt-1 text-xs text-slate-500">Out with employees</p>
            </CardContent>
          </Card>
          <Card className="relative rounded-2xl border-border/50 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Maintenance</p>
              <p className="mt-2 text-3xl font-black text-amber-600">{stats?.maintenanceCount ?? 0}</p>
              <p className="mt-1 text-xs text-slate-500">Under repair or service</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-border/50 bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
            <CardContent className="flex flex-wrap items-center gap-6 p-4">
              <div className="relative min-w-[300px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search by name, tag, or serial..."
                  className="rounded-xl border-border/50 pl-10 h-11 bg-white dark:bg-slate-950 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    className="cursor-pointer bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="it_equipment">IT Equipment</option>
                    <option value="furniture">Furniture</option>
                    <option value="vehicles">Vehicles</option>
                    <option value="software">Software</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-2 w-2 rounded-full p-0 bg-blue-500 border-none" />
                  <select
                    className="cursor-pointer bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Any Status</option>
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_maintenance">In Maintenance</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-border/30">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Asset</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Current Holder</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Location</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {isLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-6 py-6 animate-pulse">
                          <div className="h-6 w-full rounded bg-slate-100 dark:bg-slate-800" />
                        </td>
                      </tr>
                    ))
                  ) : assets.length ? (
                    assets.map((asset: any) => (
                      <tr
                        key={asset.id}
                        className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-border/50">
                              {getCategoryIcon(asset.category)}
                            </div>
                            <div>
                              <Link href={`/assets/${asset.id}`}>
                                <p className="text-sm font-black text-slate-800 dark:text-white hover:text-blue-600 transition-colors cursor-pointer">
                                  {asset.name}
                                </p>
                              </Link>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{asset.assetTag}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">
                            {asset.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(asset.status)}
                        </td>
                        <td className="px-6 py-4">
                          {asset.assignments?.[0] ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-black text-blue-600">
                                {asset.assignments[0].user?.name?.[0]}
                              </div>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {asset.assignments[0].user?.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {asset.location || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {asset.status === 'available' ? (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                                title="Assign"
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setShowAssignModal(true);
                                }}
                              >
                                <UserPlus size={16} />
                              </Button>
                            ) : asset.status === 'assigned' ? (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" 
                                title="Return / De-assign"
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setShowReturnModal(true);
                                }}
                              >
                                <RefreshCcw size={16} />
                              </Button>
                            ) : null}
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="View History">
                              <History size={16} />
                            </Button>
                            <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" 
                            title="Log Maintenance"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setShowMaintenanceModal(true);
                            }}
                          >
                            <Wrench size={16} />
                          </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400" title="More Options">
                              <MoreVertical size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300">
                            <Monitor size={48} />
                          </div>
                          <p className="text-sm font-bold text-slate-500 italic">No assets found in the registry.</p>
                          <Button variant="outline" size="sm" className="rounded-xl border-dashed" onClick={() => setIsAddModalOpen(true)}>
                             <Plus size={16} className="mr-2" /> Register your first asset
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <AddAssetModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        onSuccess={handleRefresh} 
      />
      
      <AssignAssetModal 
        open={showAssignModal} 
        onOpenChange={setShowAssignModal} 
        asset={selectedAsset}
        onSuccess={handleRefresh}
      />

      <ReturnAssetModal
        open={showReturnModal}
        onOpenChange={setShowReturnModal}
        asset={selectedAsset}
        onSuccess={handleRefresh}
      />

      <LogMaintenanceModal
        open={showMaintenanceModal}
        onOpenChange={setShowMaintenanceModal}
        asset={selectedAsset}
        onSuccess={handleRefresh}
      />
    </DashboardLayout>
  );
};

export default AssetsPage;
