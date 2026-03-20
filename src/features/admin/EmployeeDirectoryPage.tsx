import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Users, Mail, Phone, MapPin, Search, Loader2, UserPlus, Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Cake, Briefcase, Calendar, ScrollText } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteUserModal } from "@/components/InviteUserModal";

export default function EmployeeDirectory() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const canManageUsers = user?.role === "admin" || user?.role === "hr";

  const { data: employees = [], isLoading: isLoadingEmployees } = trpc.employees.list.useQuery(
    {
      search: searchTerm,
      departmentId: selectedDeptId || undefined,
    },
    { enabled: !!user }
  );

  const { data: departments = [], isLoading: isLoadingDepts } = trpc.employees.getDepartments.useQuery(undefined, { enabled: !!user });

  const { data: employeeDetail, isLoading: isLoadingDetail } = trpc.employees.getDetail.useQuery(
    { employeeId: selectedEmployee?.id || 0 },
    { enabled: showDetailModal && !!selectedEmployee }
  );

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  const getDeptColor = (dept?: string | null) => {
    if (!dept) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";

    const colors: Record<string, string> = {
      Engineering: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Human Resources": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      Finance: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Sales & Marketing": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      Operations: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };

    if (colors[dept]) return colors[dept];

    const fallbackColors = [
      "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
    ];

    const hash = dept.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return fallbackColors[hash % fallbackColors.length];
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Employee Directory</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Contact information, team context, and direct access to full employee profiles.</p>
          </div>
          <div className="flex items-center gap-3">
            {(isLoadingEmployees || isLoadingDepts) && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
            {canManageUsers && (
              <>
                <Button variant="outline" className="rounded-xl" onClick={() => setShowInviteModal(true)}>
                  <Mail size={16} className="mr-2" /> Invite User
                </Button>
                <Link href="/admin/users">
                  <Button className="rounded-xl bg-[#3b6dae] hover:bg-[#315693]">
                    <UserPlus size={16} className="mr-2" /> Create User
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input placeholder="Search by name, email, or staff ID..." className="bg-white pl-10 dark:bg-slate-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={selectedDeptId === null ? "default" : "outline"} onClick={() => setSelectedDeptId(null)} size="sm">
              All Departments
            </Button>
            {departments.map((dept: any) => (
              <Button key={dept.id} variant={selectedDeptId === dept.id ? "default" : "outline"} onClick={() => setSelectedDeptId(dept.id)} size="sm">
                {dept.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="bg-white transition-shadow hover:shadow-md dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{employees.length}</div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">in directory</p>
            </CardContent>
          </Card>

          <Card className="bg-white transition-shadow hover:shadow-md dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Now</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{employees.filter((employee: any) => employee.status === "Active" || !employee.status).length}</div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">available for work</p>
            </CardContent>
          </Card>

          <Card className="bg-white transition-shadow hover:shadow-md dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{departments.length}</div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">teams represented</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee: any) => (
            <Card key={employee.id} className="bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar className="h-14 w-14 rounded-2xl border-2 border-white/10 shadow-lg shrink-0">
                      <AvatarImage src={employee.profileImage ?? undefined} alt={employee.name ?? ""} className="object-cover" />
                      <AvatarFallback className="bg-linear-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg">
                        {employee.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={employee.name}>{employee.name}</h3>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">{employee.position || employee.role}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(employee.status)} shrink-0`}>{employee.status || "Active"}</Badge>
                </div>

                <Badge className={`${getDeptColor(employee.department)} mb-4`}>{employee.department || "No Department"}</Badge>

                <div className="mb-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${employee.email}`} className="truncate text-blue-600 hover:underline dark:text-blue-400">{employee.email}</a>
                  </div>
                  {employee.phoneNumber && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${employee.phoneNumber}`} className="text-blue-600 hover:underline dark:text-blue-400">{employee.phoneNumber}</a>
                    </div>
                  )}
                  {employee.location && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {employee.location}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full text-sm" onClick={() => handleEmployeeClick(employee)}>
                    Quick View
                  </Button>
                  <Link href={`/admin/employees/${employee.id}`}>
                    <Button className="w-full bg-blue-600 text-sm hover:bg-blue-700">Full Profile</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!isLoadingEmployees && employees.length === 0 && (
          <Card className="border-dashed bg-gray-50 dark:bg-slate-900">
            <CardContent className="p-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-400 opacity-50" />
              <p className="mb-2 text-gray-600 dark:text-gray-400">No employees found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl border-none bg-white shadow-2xl dark:bg-slate-900">
          <DialogHeader className="border-b border-gray-100 pb-4 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Users className="h-5 w-5 text-blue-600" />
              Employee Profile Preview
            </DialogTitle>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="animate-pulse text-gray-500">Fetching profile details...</p>
            </div>
          ) : employeeDetail ? (
            <div className="space-y-8 pt-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 rounded-2xl border-2 border-white/10 shadow-xl shadow-blue-500/10 shrink-0">
                  <AvatarImage src={employeeDetail.profileImage ?? undefined} alt={employeeDetail.name ?? ""} className="object-cover" />
                  <AvatarFallback className="bg-linear-to-br from-blue-600 to-indigo-600 text-white font-bold text-3xl">
                    {employeeDetail.name?.split(" ").map((part: string) => part[0]).join("").toUpperCase().slice(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{employeeDetail.name}</h2>
                    <Badge className={getStatusColor(employeeDetail.status)}>{employeeDetail.status || "Active"}</Badge>
                  </div>
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{employeeDetail.position || employeeDetail.role}</p>
                  <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">{employeeDetail.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 rounded-2xl bg-gray-50 p-6 dark:bg-slate-800/50 md:grid-cols-2">
                <PreviewItem icon={<Mail className="h-4 w-4 text-gray-400" />} label="Email Address" value={employeeDetail.email || "N/A"} />
                <PreviewItem icon={<Phone className="h-4 w-4 text-gray-400" />} label="Phone Number" value={employeeDetail.phoneNumber || "Not provided"} />
                <PreviewItem icon={<MapPin className="h-4 w-4 text-gray-400" />} label="Office Location" value={employeeDetail.location || "Kigali, Rwanda"} />
                <PreviewItem icon={<Users className="h-4 w-4 text-gray-400" />} label="Staff ID" value={employeeDetail.staffId || "N/A"} />
                <PreviewItem icon={<Calendar className="h-4 w-4 text-[#3b6dae]" />} label="Joined Date" value={employeeDetail.dateOfEmployment || "N/A"} />
                <PreviewItem icon={<Cake className="h-4 w-4 text-pink-400" />} label="Date of Birth" value={employeeDetail.dateOfBirth || "Not provided"} />
                <PreviewItem icon={<Briefcase className="h-4 w-4 text-amber-500" />} label="Contract Type" value={employeeDetail.contractType || "Full-time"} />
                <PreviewItem icon={<Calendar className="h-4 w-4 text-[#3b6dae]" />} label="Contract Duration" value={`${employeeDetail.contractStart || "N/A"} to ${employeeDetail.contractEnd || "Present"}`} />
              </div>

              {employeeDetail.jobDescription && (
                <div className="rounded-2xl bg-gray-50 p-6 dark:bg-slate-800/50">
                  <div className="mb-2 flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-blue-500" />
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Job Description & Responsibilities</p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">{employeeDetail.jobDescription}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Link href={`/admin/employees/${employeeDetail.id}`}>
                  <Button className="h-11 flex-1 bg-blue-600 hover:bg-blue-700">Full Profile</Button>
                </Link>
                <Button variant="outline" className="h-11 flex-1" onClick={() => setShowDetailModal(false)}>
                  Close Preview
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {canManageUsers && (
        <InviteUserModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          onSuccess={() => setShowInviteModal(false)}
        />
      )}
    </DashboardLayout>
  );
}

function PreviewItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</p>
      <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
        {icon}
        {value}
      </div>
    </div>
  );
}

