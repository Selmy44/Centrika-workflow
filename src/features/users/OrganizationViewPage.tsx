import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Users, Loader2, Building2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export default function OrganizationViewPage() {
  const { user } = useAuth();
  
  const { data: employees = [], isLoading: isLoadingEmployees } = trpc.employees.list.useQuery(
    {},
    { enabled: !!user }
  );
  
  const { data: departments = [], isLoading: isLoadingDepts } = trpc.employees.getDepartments.useQuery(undefined, { enabled: !!user });

  const isLoading = isLoadingEmployees || isLoadingDepts;

  // Group employees by department
  const employeesByDept = departments.map((dept: any) => ({
    ...dept,
    employees: employees.filter((emp: any) => emp.department === dept.name),
  }));

  // Find users without department (often leadership or system admins)
  const unassignedEmployees = employees.filter((emp: any) => !emp.department);

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#3b6dae] dark:text-[#c79d2d] flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              Organization View
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
              Interactive structural overview of the company
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-semibold">Syncing structure...</span>
            </div>
          )}
        </div>

        <div className="grid gap-8">
          <div className="space-y-12">
            {employeesByDept.map((dept: any, deptIndex: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: deptIndex * 0.1 }}
                key={dept.id} 
                className="relative"
              >
                <div className="flex items-center gap-4 mb-6 sticky top-16 z-10 bg-[#FFFAE8] dark:bg-slate-950/95 py-4 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                  <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {dept.name}
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                      {dept.employees.length} Team Member{dept.employees.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6 pl-4 md:pl-8 border-l-2 border-slate-200 dark:border-slate-800 ml-6 pb-4">
                  {dept.employees.length > 0 ? (
                    dept.employees.map((emp: any) => (
                      <Card 
                        key={emp.id} 
                        className="group overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm relative"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-5 flex items-start gap-4">
                          <Avatar className="h-16 w-16 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md shrink-0">
                            <AvatarImage src={emp.profileImage} className="object-cover" />
                            <AvatarFallback className="bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-white font-bold text-xl">
                              {emp.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                              {emp.name}
                            </h3>
                            <p className="text-sm font-semibold tracking-wide text-blue-600 dark:text-blue-400 truncate mt-0.5 mb-2 line-clamp-2 leading-tight">
                              {emp.position || emp.role}
                            </p>
                            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px] uppercase tracking-wider">
                              {emp.status || 'Active'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center bg-white/30 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                      <Users className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="text-slate-500 text-sm font-medium">No team members assigned</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {unassignedEmployees.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: employeesByDept.length * 0.1 }}
                className="relative"
              >
                <div className="flex items-center gap-4 mb-6 sticky top-16 z-10 bg-[#FFFAE8] dark:bg-slate-950/95 py-4 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                  <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white shadow-lg shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Unassigned / Leadership
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                      {unassignedEmployees.length} Team Member{unassignedEmployees.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6 pl-4 md:pl-8 border-l-2 border-slate-200 dark:border-slate-800 ml-6 pb-4">
                  {unassignedEmployees.map((emp: any) => (
                    <Card 
                      key={emp.id} 
                      className="group overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm relative"
                    >
                      <CardContent className="p-5 flex items-start gap-4">
                        <Avatar className="h-16 w-16 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md shrink-0">
                          <AvatarImage src={emp.profileImage} className="object-cover" />
                          <AvatarFallback className="bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-white font-bold text-xl">
                            {emp.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {emp.name}
                          </h3>
                          <p className="text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-400 truncate mt-0.5 mb-2 leading-tight">
                            {emp.position || emp.role}
                          </p>
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px] uppercase tracking-wider">
                            {emp.status || 'Active'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
