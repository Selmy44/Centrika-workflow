import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Calendar, FileText, Mail, MapPin, Phone, ArrowLeft, Download, CheckCircle, Clock3, ShieldCheck, Activity, Cake, ClipboardList } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormatter";
import { Skeleton } from "@/components/ui/skeleton";

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
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Employee Profile</h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Record ID: {employee.staffId || "CTK-NEW"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <Card className="sticky top-24 h-fit overflow-hidden rounded-3xl border-border/50 bg-white/60 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
            <div className="h-24 bg-linear-to-br from-blue-600 to-indigo-700" />
            <CardContent className="-mt-12 flex flex-col items-center pt-0">
              <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 text-3xl font-black text-[#315693] dark:border-slate-900 dark:bg-slate-800">
                {employee.profileImage ? (
                  <img src={employee.profileImage} alt={employee.name || "Employee"} className="h-full w-full object-cover" />
                ) : (
                  employee.name?.[0]
                )}
              </div>
              <h2 className="mb-1 text-center text-lg font-black text-slate-800 dark:text-white">{employee.name}</h2>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">{employee.position || "Staff Member"}</p>
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

              <div className="mt-6 grid w-full grid-cols-2 gap-3">
                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={() => { window.location.href = `mailto:${employee.email}`; }}>
                  <Mail size={14} className="mr-2" /> Email
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => { window.location.href = "/hr/documents"; }}>
                  <FileText size={14} className="mr-2" /> Docs
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Request Volume</p>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{employee.requestsCount}</p>
                  <p className="mt-1 text-xs text-slate-500">Total requests on record</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Annual Leave Left</p>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{leaveBalance?.annualLeaveRemaining ?? "-"}</p>
                  <p className="mt-1 text-xs text-slate-500">Current-year remaining balance</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verified Docs</p>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{verifiedDocs}</p>
                  <p className="mt-1 text-xs text-slate-500">Documents cleared by HR</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Docs</p>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{pendingDocs}</p>
                  <p className="mt-1 text-xs text-slate-500">Items still awaiting review</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="rounded-2xl border border-border/30 bg-slate-100 p-1 dark:bg-slate-800/50">
                <TabsTrigger value="overview" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">Overview</TabsTrigger>
                <TabsTrigger value="leave" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">Leave Insights</TabsTrigger>
                <TabsTrigger value="documents" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card className="rounded-2xl border-border/50">
                    <CardHeader className="border-b border-border/30 py-4">
                      <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <User size={14} /> Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 py-6">
                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Full Name" value={employee.name} />
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
                </div>
              </TabsContent>

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
                      <MetricRow label="Entitled" value={leaveBalance?.annualLeaveEntitled ?? "-"} icon={<ShieldCheck size={14} className="text-blue-500" />} />
                      <MetricRow label="Taken" value={leaveBalance?.annualLeaveTaken ?? "-"} icon={<Activity size={14} className="text-rose-500" />} />
                      <MetricRow label="Remaining" value={leaveBalance?.annualLeaveRemaining ?? "-"} icon={<CheckCircle size={14} className="text-emerald-500" />} />
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
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm font-bold capitalize text-slate-900 dark:text-white">{request.details?.leaveType || "Leave"} leave</p>
                                <p className="text-xs text-slate-500">
