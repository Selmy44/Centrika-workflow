import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Loader2, 
  Search,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function DepartmentManagement() {
  const { user, hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", hodId: "" });

  const utils = trpc.useUtils();
  const { data: departments = [], isLoading } = trpc.employees.getDepartments.useQuery(undefined, { enabled: !!user });
  const { data: users = [] } = trpc.employees.list.useQuery({}, { enabled: !!user });

  const createMutation = trpc.employees.createDepartment.useMutation({
    onSuccess: () => {
      toast.success("Department created", { description: "Successfully added new department." });
      utils.employees.getDepartments.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const updateMutation = trpc.employees.updateDepartment.useMutation({
    onSuccess: () => {
      toast.success("Department updated", { description: "Changes saved successfully." });
      utils.employees.getDepartments.invalidate();
      setEditingDept(null);
      resetForm();
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const deleteMutation = trpc.employees.deleteDepartment.useMutation({
    onSuccess: () => {
      toast.success("Department deleted", { description: "Successfully removed department." });
      utils.employees.getDepartments.invalidate();
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const resetForm = () => setFormData({ name: "", description: "", hodId: "" });

  const handleEdit = (dept: any) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || "",
      hodId: dept.hodId ? String(dept.hodId) : "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      hodId: formData.hodId ? Number(formData.hodId) : undefined,
    };

    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredDepts = departments.filter((d: any) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAuthorized = hasRole?.("admin") || hasRole?.("hr") || hasRole?.("ceo_md");
  if (!user || !isAuthorized) {
    return <div className="p-8">Access Denied</div>;
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#3b6dae] dark:text-[#c79d2d]">Department Management</h1>
            <p className="text-gray-500 mt-1">Configure company organization and assign heads</p>
          </div>
          <Dialog open={isCreateOpen || !!editingDept} onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditingDept(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingDept ? "Edit Department" : "Create New Department"}</DialogTitle>
                  <DialogDescription>
                    Define department details and assign a Head of Department.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department Name</label>
                    <Input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Quality Assurance"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Brief overview of duties"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Head of Department</label>
                    <Select 
                      value={formData.hodId} 
                      onValueChange={(val) => setFormData({...formData, hodId: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select HOD..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- No HOD --</SelectItem>
                        {users.map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name} ({u.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingDept ? "Save Changes" : "Create Department"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input 
            className="pl-10"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />
            ))
          ) : filteredDepts.length > 0 ? (
            filteredDepts.map((dept: any) => (
              <Card key={dept.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      <CardDescription className="text-xs">ID: {dept.id}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)}>
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hover:text-red-600"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${dept.name}?`)) {
                          deleteMutation.mutate({ id: dept.id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="mt-4">
                  <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                    {dept.description || "No description provided."}
                  </p>
                  
                  <div className="mt-6 pt-4 border-t flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{users.filter((u: any) => u.departmentId === dept.id).length} Employees</span>
                    </div>
                    {dept.hodId && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                        <Users className="w-4 h-4" />
                        <span>HOD: {users.find((u: any) => u.id === dept.hodId)?.name || "Unknown"}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-3 bg-gray-50 rounded-2xl border-2 border-dashed">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 font-medium">No departments found</p>
              <Button variant="link" onClick={() => setIsCreateOpen(true)}>Create your first department</Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
