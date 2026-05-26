import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Calendar, FileText, Mail, MapPin, Phone, ArrowLeft, Download, CheckCircle, Clock3, ShieldCheck, Activity, ClipboardList, Car, DollarSign, Package, TrendingUp, XCircle, Building2 } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormatter";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const EmployeeProfilePage = () => {
  const [, params] = useRoute("/admin/employees/:id");
  const employeeId = params?.id ? parseInt(params.id, 10) : null;

  const { data: employee, isLoading: userLoading } = trpc.employees.getDetail.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId }
  );

  const { data: documents = [], isLoading: docsLoading } = trpc.hr.listDocuments.useQuery(
    { userId: employeeId! },
    { enabled: !!employeeId }
  );

  const { data: leaveData } = trpc.requests.getEmployeeLeaveData.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId }
  );

  if (userLoading) return <ProfileSkeleton />;

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold">Employee not found</h2>
          <Button variant="link" onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const verifiedDocs = documents.filter((doc: any) => doc.status === "verified").length;
  const pendingDocs = documents.filter((doc: any) => doc.status === "pending").length;
  const leaveRequests = leaveData?.leaveRequests ?? [];
  const leaveBalance = leaveData?.leaveBalance;
  const allRequests = (employee as any).allRequests ?? [];
  const approvedCount = (employee as any).approvedCount ?? 0;
  const rejectedCount = (employee as any).rejectedCount ?? 0;
  const pendingCount = (employee as any).pendingCount ?? 0;
  const approvalRate = employee.requestsCount > 0 ? Math.round((approvedCount / employee.requestsCount) * 100) : 0;

  const requestsByType = useMemo(() => {
    const map: Record<string, number> = {};
    allRequests.forEach((r: any) => {
      map[r.type] = (map[r.type] || 0) + 1;
    });
    return map;
  }, [allRequests]);

  const getStatusColor = (status?: string | null) => {
    switch ((status || "active").toLowerCase()) {
      case "active":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";
      case "on leave":
        return "border-amber-500/20 bg-amber-500/10 text-amber-600";
      case "terminated":
      case "inactive":
        return "border-rose-500/20 bg-rose-500/10 text-rose-600";
      default:
        return "border-slate-500/20 bg-slate-500/10 text-slate-600";
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case "leave": return <Calendar size={14} className="text-blue-500" />;
      case "car": return <Car size={14} className="text-indigo-500" />;
      case "expenditure": return <DollarSign size={14} className="text-emerald-500" />;
      case "asset": return <Package size={14} className="text-amber-500" />;
      default: return <FileText size={14} className="text-slate-400" />;
    }
  };

  const getRequestStatusBadge = (status: string) => {
    const cls = status === "approved"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
      : status === "rejected"
        ? "border-rose-500/20 bg-rose-500/10 text-rose-600"
        : status === "draft"
          ? "border-slate-500/20 bg-slate-500/10 text-slate-600"
          : "border-amber-500/20 bg-amber-500/10 text-amber-600";
    return <Badge className={cls}>{status}</Badge>;
  };

  const employmentWindow = employee.contractStart || employee.contractEnd
    ? `${employee.contractStart || "Start date pending"} to ${employee.contractEnd || "Open-ended"}`
    : "Contract dates not captured";

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="h-8 w-8 rounded-full p-0">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#3b6dae] dark:text-[#c79d2d]">Employee Profile</h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Record ID: {employee.staffId || "CTK-NEW"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Left Panel — Profile Card */}
          <Card className="lg:sticky lg:top-24 h-fit overflow-hidden rounded-3xl border-border/50 bg-white/60 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
            <div className="h-24 bg-gradient-to-br from-[#3b6dae] to-indigo-700" />
            <CardContent className="-mt-12 flex flex-col items-center pt-0">
              <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 text-3xl font-black text-[#315693] dark:border-slate-900 dark:bg-slate-800">
                {employee.profileImage ? (
                  <img src={employee.profileImage} alt={employee.name || "Employee"} className="h-full w-full object-cover" />
                ) : (
                  employee.name?.[0]
                )}
              </div>
              <h2 className="mb-1 text-center text-lg font-black text-slate-800 dark:text-white">{employee.name}</h2>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#3b6dae] dark:text-blue-400">{employee.position || "Staff Member"}</p>
              <Badge className={getStatusColor(employee.status)}>{employee.status || "Active"}</Badge>

              <div className="mt-8 w-full space-y-4 border-t border-border/30 pt-6">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Mail size={16} className="text-slate-400" />
                  <span className="w-full truncate text-xs font-medium">{employee.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Building2 size={16} className="text-slate-400" />
                  <span className="text-xs font-medium">{employee.department || "Unassigned"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="text-xs font-medium">{employee.location || "Kigali, Rwanda"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Phone size={16} className="text-slate-400" />
                  <span className="text-xs font-medium">{employee.phoneNumber || "Not provided"}</span>
                </div>
              </div>

              {/* Approval Rate Ring */}
              <div className="mt-6 w-full rounded-2xl border border-border/40 bg-slate-50/80 p-5 dark:bg-slate-950/30">
                <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Approval Rate</p>
                <div className="relative mx-auto h-24 w-24">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={approvalRate >= 70 ? "#10b981" : approvalRate >= 40 ? "#f59e0b" : "#ef4444"} strokeWidth="3" strokeDasharray={`${approvalRate}, 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-800 dark:text-white">{approvalRate}%</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                  <div>
                    <p className="text-sm font-black text-emerald-600">{approvedCount}</p>
                    <p className="text-[9px] text-slate-400">Approved</p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-600">{pendingCount}</p>
                    <p className="text-[9px] text-slate-400">Pending</p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-rose-600">{rejectedCount}</p>
                    <p className="text-[9px] text-slate-400">Rejected</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid w-full grid-cols-2 gap-3">
                <Button className="rounded-xl bg-[#3b6dae] hover:bg-[#315693]" onClick={() => { window.location.href = `mailto:${employee.email}`; }}>
                  <Mail size={14} className="mr-2" /> Email
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => { window.location.href = "/hr/documents"; }}>
                  <FileText size={14} className="mr-2" /> Docs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel — Content */}
          <div className="lg:col-span-3">
            {/* Summary Stat Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="overflow-hidden rounded-2xl border-border/50 bg-gradient-to-br from-white to-blue-50/40 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <ClipboardList size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Requests</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{employee.requestsCount}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-blue-600">All types on record</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-2xl border-border/50 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Leave Balance</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{leaveBalance?.annualLeaveRemaining ?? "–"}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-emerald-600">Days remaining this year</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-2xl border-border/50 bg-gradient-to-br from-white to-indigo-50/40 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verified Docs</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{verifiedDocs}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-indigo-600">Cleared by HR</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-2xl border-border/50 bg-gradient-to-br from-white to-amber-50/40 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                      <Clock3 size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Docs</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingDocs}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-amber-600">Awaiting review</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="rounded-2xl border border-border/30 bg-slate-100 p-1 dark:bg-slate-800/50">
                <TabsTrigger value="overview" className="rounded-xl px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">Overview</TabsTrigger>
                <TabsTrigger value="requests" className="rounded-xl px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">All Requests</TabsTrigger>
                <TabsTrigger value="leave" className="rounded-xl px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">Leave Insights</TabsTrigger>
                <TabsTrigger value="documents" className="rounded-xl px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">Documents</TabsTrigger>
              </TabsList>

              {/* Tab: Overview */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card className="rounded-2xl border-border/50">
                    <CardHeader className="border-b border-border/30 py-4">
                      <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <User size={14} /> Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 py-6">
                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Full Name" value={employee.name || "N/A"} />
                        <InfoItem label="Date of Birth" value={employee.dateOfBirth || "N/A"} />
                        <InfoItem label="Email" value={employee.email || "N/A"} />
                        <InfoItem label="Phone" value={employee.phoneNumber || "N/A"} />
                        <InfoItem label="Location" value={employee.location || "Kigali, Rwanda"} />
                        <InfoItem label="Status" value={employee.status || "Active"} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-border/50">
                    <CardHeader className="border-b border-border/30 py-4">
                      <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <Briefcase size={14} /> Job & Contract Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 py-6">
                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Department" value={employee.department || "Unassigned"} />
                        <InfoItem label="Role" value={employee.role} />
                        <InfoItem label="Employment Date" value={employee.dateOfEmployment || "N/A"} />
                        <InfoItem label="Contract Type" value={employee.contractType || "Full-Time"} />
                      </div>
                      <div className="rounded-2xl border border-border/40 bg-slate-50/80 p-4 dark:bg-slate-950/30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contract Window</p>
                        <p className="mt-2 text-sm font-bold text-slate-800 dark:text-white">{employmentWindow}</p>
                      </div>
                      <div className="rounded-2xl border border-border/40 bg-slate-50/80 p-4 dark:bg-slate-950/30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Job Description</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{employee.jobDescription || "No job description has been provided for this employee yet."}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Request Distribution Card */}
                  <Card className="rounded-2xl border-border/50 md:col-span-2">
                    <CardHeader className="border-b border-border/30 py-4">
                      <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <TrendingUp size={14} /> Request Activity Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-6">
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[
                          { type: "leave", label: "Leave Requests", icon: <Calendar size={18} className="text-blue-500" />, color: "bg-blue-100 text-blue-600" },
                          { type: "car", label: "Car Requests", icon: <Car size={18} className="text-indigo-500" />, color: "bg-indigo-100 text-indigo-600" },
                          { type: "expenditure", label: "Expenditure", icon: <DollarSign size={18} className="text-emerald-500" />, color: "bg-emerald-100 text-emerald-600" },
                          { type: "asset", label: "Asset Requests", icon: <Package size={18} className="text-amber-500" />, color: "bg-amber-100 text-amber-600" },
                        ].map(({ type, label, icon, color }) => (
                          <div key={type} className="flex items-center gap-4 rounded-2xl border border-border/40 bg-slate-50/80 p-4 dark:bg-slate-950/30">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{icon}</div>
                            <div>
                              <p className="text-xl font-black text-slate-900 dark:text-white">{requestsByType[type] || 0}</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: All Requests */}
              <TabsContent value="requests">
                <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
                  <CardHeader className="border-b border-border/30 bg-white px-6 py-4 dark:bg-slate-900">
                    <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                      <ClipboardList size={16} /> Complete Request History
                    </CardTitle>
                    <CardDescription className="text-xs">Every request ever submitted by this employee, across all categories.</CardDescription>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Details</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Submitted</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {allRequests.length ? allRequests.map((req: any) => (
                          <tr key={req.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {getRequestIcon(req.type)}
                                <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">{req.type}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <RequestDetailSummary type={req.type} details={req.details} />
                            </td>
                            <td className="px-6 py-4">{getRequestStatusBadge(req.status)}</td>
                            <td className="px-6 py-4 text-[10px] font-medium text-slate-400">{formatDateTime(req.createdAt)}</td>
                            <td className="px-6 py-4 text-right">
                              <Link href={`/requests/${req.id}`}>
                                <Button variant="ghost" size="sm" className="rounded-xl text-[#3b6dae]">View</Button>
                              </Link>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-sm italic text-slate-500">
                              No requests on record for this employee.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* Tab: Leave Insights */}
              <TabsContent value="leave">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                  <Card className="rounded-2xl border-border/50 xl:col-span-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
                        <Calendar size={16} /> Leave Balance Snapshot
                      </CardTitle>
                      <CardDescription className="text-xs">Current-year balance and leave usage.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <MetricRow label="Entitled" value={leaveBalance?.annualLeaveEntitled ?? "–"} icon={<ShieldCheck size={14} className="text-blue-500" />} />
                      <MetricRow label="Taken" value={leaveBalance?.annualLeaveTaken ?? "–"} icon={<Activity size={14} className="text-rose-500" />} />
                      <MetricRow label="Remaining" value={leaveBalance?.annualLeaveRemaining ?? "–"} icon={<CheckCircle size={14} className="text-emerald-500" />} />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-border/50 xl:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
                        <ClipboardList size={16} /> Leave History
                      </CardTitle>
                      <CardDescription className="text-xs">Past leave requests and their current outcome.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {leaveRequests.length ? (
                        leaveRequests.map((request: any) => (
                          <div key={request.id} className="rounded-2xl border border-border/40 bg-slate-50/80 p-4 dark:bg-slate-950/30">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="text-sm font-bold capitalize text-slate-900 dark:text-white">{request.details?.leaveType || "Leave"} leave</p>
                                <p className="text-xs text-slate-500">
                                  {request.details?.startDate} to {request.details?.endDate} · {request.details?.leaveDaysRequested || 0} day(s)
                                </p>
                              </div>
                              {getRequestStatusBadge(request.status)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">
                          No leave history records found.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Documents */}
              <TabsContent value="documents">
                <Card className="rounded-2xl border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
                      <FileText size={16} /> Employee Documents
                    </CardTitle>
                    <CardDescription className="text-xs">Uploaded records, verification status, and download access.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {docsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                      </div>
                    ) : documents.length ? (
                      documents.map((doc: any) => (
                        <div key={doc.id} className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-slate-50/80 p-4 dark:bg-slate-950/30 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-white">{doc.name}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{doc.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getRequestStatusBadge(doc.status)}
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="rounded-xl">
                                <Download size={14} className="mr-2" /> Open
                              </Button>
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <FileText className="mx-auto mb-2 text-slate-300" size={32} />
                        <p className="text-sm italic text-slate-500">No documents uploaded yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Helper: Compact request detail summary for the table
const RequestDetailSummary = ({ type, details }: { type: string; details: any }) => {
  if (!details) return <span className="text-xs italic text-slate-400">No details</span>;

  switch (type) {
    case "leave":
      return (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <span className="font-bold capitalize">{details.leaveType}</span> · {details.startDate} → {details.endDate} · {details.leaveDaysRequested || 0}d
        </div>
      );
    case "car":
      return (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <span className="font-bold">{details.destination || "Trip"}</span> · {details.departureDate || "N/A"}
        </div>
      );
    case "expenditure":
      return (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <span className="font-bold">{details.description || details.category || "Expense"}</span> · RWF {Number(details.amount || 0).toLocaleString()}
        </div>
      );
    case "asset":
      return (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <span className="font-bold">{details.assetName || details.type || "Asset"}</span> · {details.quantity || 1} unit(s)
        </div>
      );
    default:
      return <span className="text-xs italic text-slate-400">—</span>;
  }
};

const InfoItem = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className="text-sm font-bold text-slate-800 dark:text-white">{value}</p>
  </div>
);

const MetricRow = ({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) => (
  <div className="flex items-center justify-between rounded-xl border border-border/40 bg-slate-50/80 p-4 dark:bg-slate-950/30">
    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
      {icon}
      <span className="text-sm font-bold">{label}</span>
    </div>
    <span className="text-sm font-black text-slate-900 dark:text-white">{value}</span>
  </div>
);

const ProfileSkeleton = () => (
  <DashboardLayout>
    <div className="space-y-8 p-8 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <Skeleton className="h-[520px] rounded-3xl" />
        <div className="space-y-8 lg:col-span-3">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default EmployeeProfilePage;
