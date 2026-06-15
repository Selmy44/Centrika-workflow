import { useAuth } from "@/_core/hooks/useAuth";
import { formatRole } from "@/utils/roleUtils";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Edit2, Trash2, Plus, Mail, User, RotateCw, X, MoreHorizontal, Key, Phone, ShieldOff, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InviteUserModal } from "@/components/InviteUserModal";
import SingleDatePicker from "@/components/SingleDatePicker";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";

export default function AdminUsers() {
  const { isAuthenticated, user, hasRole } = useAuth();
  const canManageUsers = hasRole?.("admin") || hasRole?.("hr") || user?.role === "admin" || user?.role === "hr";

  const checkIsAdmin = (u: any) => {
    if (!u) return false;
    if (u.role === "admin") return true;
    if (u.additionalRoles) {
      try {
        const parsed = typeof u.additionalRoles === 'string' && u.additionalRoles.trim().startsWith('[') 
          ? JSON.parse(u.additionalRoles) 
          : String(u.additionalRoles).split(',').map((r: string) => r.trim());
        if (Array.isArray(parsed) && parsed.includes("admin")) return true;
      } catch (e) {}
    }
    return false;
  };
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [showAnonymizeDialog, setShowAnonymizeDialog] = useState(false);
  const [lifecycleReason, setLifecycleReason] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [managerId, setManagerId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDepartmentId, setCreateDepartmentId] = useState("");
  const [createPosition, setCreatePosition] = useState("");
  const [createEmploymentDate, setCreateEmploymentDate] = useState("");
  const [createRole, setCreateRole] = useState("user");
  const [createDateOfBirth, setCreateDateOfBirth] = useState("");
  const [createJobDescription, setCreateJobDescription] = useState("");
  const [createContractType, setCreateContractType] = useState("");
  const [createContractStart, setCreateContractStart] = useState("");
  const [createContractEnd, setCreateContractEnd] = useState("");
  const [createGender, setCreateGender] = useState("");
  
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [editJobDescription, setEditJobDescription] = useState("");
  const [editContractType, setEditContractType] = useState("");
  const [editContractStart, setEditContractStart] = useState("");
  const [editContractEnd, setEditContractEnd] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editGender, setEditGender] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [editProfileImage, setEditProfileImage] = useState("");
  const [createPhoneNumber, setCreatePhoneNumber] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: users, isLoading, refetch } = (trpc as any).users.listAll.useQuery(undefined, {
    enabled: isAuthenticated && canManageUsers,
  });

  const { data: pendingInvitations, refetch: refetchInvitations } = (trpc as any).invitations.getPendingInvitations.useQuery(undefined, {
    enabled: isAuthenticated && canManageUsers,
  });

  const { data: departments } = (trpc as any).employees.getDepartments.useQuery();

  const updateUserMutation = (trpc as any).users.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully!");
      setShowDialog(false);
      setEditingUser(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const resetPasswordMutation = (trpc as any).users.resetUserPassword.useMutation({
    onSuccess: () => {
      toast.success("Password reset successfully!");
      setShowPasswordDialog(false);
      setNewPassword("");
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reset password");
    },
  });

  const deactivateUserMutation = (trpc as any).users.deactivateUser.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message || "User deactivated successfully!");
      setShowDeactivateDialog(false);
      setLifecycleReason("");
      setEditingUser(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to deactivate user");
    },
  });

  const reactivateUserMutation = (trpc as any).users.reactivateUser.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message || "User reactivated successfully!");
      setShowReactivateDialog(false);
      setEditingUser(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reactivate user");
    },
  });

  const permanentDeleteUserMutation = (trpc as any).users.permanentDeleteUser.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message || "User permanently deleted!");
      setShowPermanentDeleteDialog(false);
      setLifecycleReason("");
      setEditingUser(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const anonymizeUserMutation = (trpc as any).users.anonymizeUser.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message || "User PII has been anonymized.");
      setShowAnonymizeDialog(false);
      setLifecycleReason("");
      setEditingUser(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to anonymize user");
    },
  });

  const resendInvitationMutation = (trpc as any).invitations.resendInvitation.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message);
      refetchInvitations();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to resend invitation");
    },
  });

  const cancelInvitationMutation = (trpc as any).invitations.cancelInvitation.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message);
      refetchInvitations();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel invitation");
    },
  });

  const createUserMutation = (trpc as any).users.createUser.useMutation({
    onSuccess: (data: any) => {
      toast.success(`User created! Temporary password: ${data.message.split(': ')[1]}`);
      setShowCreateDialog(false);
      setCreateEmail("");
      setCreateName("");
      setCreateDepartmentId("");
      setCreatePosition("");
      setCreateEmploymentDate("");
      setCreateRole("user");
      setCreateDateOfBirth("");
      setCreateJobDescription("");
      setCreateContractType("");
      setCreateContractStart("");
      setCreateContractEnd("");
      setCreateGender("");
      setProfileImage("");
      setCreatePhoneNumber("");
      setValidationErrors({});
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  if (!canManageUsers) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-135">
          <Card className="w-full max-w-112">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You don't have permission to manage users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Only administrators can access this page.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const filteredUsers = users?.filter((user: any) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEditClick = (userData: any) => {
    setEditingUser(userData);
    setRole(userData.role || "user");
    setDepartment(userData.departmentId ? String(userData.departmentId) : "");
    setManagerId(userData.managerId ? String(userData.managerId) : "");
    setStaffId(userData.staffId || "");
    setEditPosition(userData.position || "");
    setEditDateOfBirth(userData.dateOfBirth || "");
    setEditJobDescription(userData.jobDescription || "");
    setEditContractType(userData.contractType || "");
    setEditContractStart(userData.contractStart || "");
    setEditContractEnd(userData.contractEnd || "");
    setEditGender(userData.gender || "");
    setEditProfileImage(userData.profileImage || "");
    setEditPhoneNumber(userData.phoneNumber || "");
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    const errors: Record<string, string> = {};
    if (!editGender) {
      errors.gender = "Gender must be selected";
    }
    if (editContractType) {
      if (!editContractStart) {
        errors.contractStart = "Contract Start Date is required when Contract Type is selected";
      }
      if ((editContractType === "Full-time" || editContractType === "Contract") && !editContractEnd) {
        errors.contractEnd = "Contract End Date is required for Full-time or Contract employee types";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        role: role as any,
        departmentId: department ? parseInt(department) : undefined,
        managerId: managerId ? parseInt(managerId) : undefined,
        staffId: staffId || undefined,
        position: editPosition || undefined,
        dateOfBirth: editDateOfBirth || undefined,
        jobDescription: editJobDescription || undefined,
        contractType: editContractType || undefined,
        contractStart: editContractStart || undefined,
        contractEnd: editContractEnd || undefined,
        gender: editGender || undefined,
        profileImage: editProfileImage || undefined,
        phoneNumber: editPhoneNumber || undefined,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { bg: string; text: string }> = {
      user: { bg: "bg-gray-500/20", text: "text-gray-400" },
      admin: { bg: "bg-red-500/20", text: "text-red-400" },
      hr: { bg: "bg-blue-500/20", text: "text-blue-400" },
      head_of_department: { bg: "bg-purple-500/20", text: "text-purple-400" },
      head_of_finance: { bg: "bg-purple-500/20", text: "text-purple-400" },
      ceo_md: { bg: "bg-amber-500/20", text: "text-amber-400" },
    };

    const config = roleConfig[role] || roleConfig.user;
    const label = formatRole(role);

    return (
      <Badge className={`${config.bg} ${config.text}`}>
        {label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#3b6dae] dark:text-[#c79d2d]">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage user roles and permissions</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Premium animated search bar */}
            <div className="relative group transition-all duration-300 z-10 w-full lg:w-56 shrink-0 lg:focus-within:w-80">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3b6dae] to-[#c79d2d] rounded-xl blur opacity-0 group-hover:opacity-20 group-focus-within:opacity-30 transition duration-500"></div>
              <div className="relative flex items-center">
                <svg className="absolute left-3.5 w-4 h-4 text-slate-400 group-focus-within:text-[#3b6dae] transition-colors z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  placeholder="Search users by name, email, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full lg:w-56 focus:w-full lg:focus:w-80 h-10 pl-10 pr-4 text-xs font-semibold rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-sm focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 focus:ring-2 focus:ring-[#3b6dae]/20 focus:border-[#3b6dae]/40"
                />
              </div>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2 bg-[#3b6dae] hover:bg-[#2d5385] text-white shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#3b6dae] focus-visible:ring-offset-2 w-full sm:w-auto"
            >
              <User size={16} />
              Create User
            </Button>
            <Button
              onClick={() => setShowInviteModal(true)}
              variant="outline"
              className="gap-2 border-[#3b6dae]/20 text-[#3b6dae] hover:bg-[#3b6dae]/5 transition-all focus-visible:ring-2 focus-visible:ring-[#3b6dae] focus-visible:ring-offset-2 w-full sm:w-auto"
            >
              <Mail size={16} />
              Invite User
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-accent" size={32} />
              </div>
            </CardContent>
          </Card>
        ) : !users || users.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users match your search</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Staff ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Department</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((userData: any) => (
                      <tr key={userData.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-foreground font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 rounded-lg shrink-0">
                              <AvatarImage src={userData.profileImage ?? undefined} alt={userData.name ?? ""} className="object-cover" />
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-bold dark:bg-blue-900/30 dark:text-blue-300">
                                {userData.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[150px]" title={userData.name}>{userData.name}</span>
                            {userData.status === "Inactive" && (
                              <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 text-[10px] py-0 px-2 rounded-full font-medium shrink-0 shadow-sm ml-2">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{userData.email}</td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{userData.staffId || "-"}</td>
                        <td className="py-3 px-4">{getRoleBadge(userData.role)}</td>
                        <td className="py-3 px-4 text-muted-foreground">{userData.department?.name || "-"}</td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted transition-colors">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-xl p-2 shadow-xl border-border/50 backdrop-blur-sm">
                              <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5">
                                User Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-border/50" />
                              <DropdownMenuItem 
                                onClick={() => handleEditClick(userData)}
                                className="flex items-center gap-2 py-2.5 px-2 rounded-lg cursor-pointer hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                                <span className="font-medium text-xs">Edit Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setEditingUser(userData);
                                  setShowPasswordDialog(true);
                                }}
                                className="flex items-center gap-2 py-2.5 px-2 rounded-lg cursor-pointer hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                              >
                                <Key className="h-4 w-4" />
                                <span className="font-medium text-xs">Reset Password</span>
                              </DropdownMenuItem>
                              {canManageUsers && userData.id !== user?.id && (
                                <>
                                  <DropdownMenuSeparator className="bg-border/50" />
                                  {userData.status !== "Inactive" ? (
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setEditingUser(userData);
                                        setLifecycleReason("");
                                        setShowDeactivateDialog(true);
                                      }}
                                      className="flex items-center gap-2 py-2.5 px-2 rounded-lg cursor-pointer text-orange-500 hover:bg-orange-500/10 transition-colors"
                                    >
                                      <ShieldOff className="h-4 w-4" />
                                      <span className="font-medium text-xs">Deactivate User</span>
                                    </DropdownMenuItem>
                                  ) : (
                                    <>
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setEditingUser(userData);
                                          setShowReactivateDialog(true);
                                        }}
                                        className="flex items-center gap-2 py-2.5 px-2 rounded-lg cursor-pointer text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                      >
                                        <UserCheck className="h-4 w-4" />
                                        <span className="font-medium text-xs">Reactivate User</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setEditingUser(userData);
                                          setLifecycleReason("");
                                          setShowAnonymizeDialog(true);
                                        }}
                                        className="flex items-center gap-2 py-2.5 px-2 rounded-lg cursor-pointer text-gray-500 hover:bg-gray-500/10 transition-colors"
                                      >
                                        <UserX className="h-4 w-4" />
                                        <span className="font-medium text-xs">Anonymize (Privacy)</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-border/50" />
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setEditingUser(userData);
                                          setLifecycleReason("");
                                          setShowPermanentDeleteDialog(true);
                                        }}
                                        className="flex items-center gap-2 py-2.5 px-2 rounded-lg cursor-pointer text-red-500 hover:bg-red-500/10 transition-colors font-semibold"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="text-xs">Delete Permanently</span>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          setValidationErrors({});
          setEditingUser(null);
        }
      }}>
        <DialogContent className="max-w-112">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
            <DialogDescription>
              Update user role, department, and HR details
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="general">General Info</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 max-h-135 overflow-y-auto px-1">
              <div className="space-y-2">
                <Label>User</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-foreground">{editingUser?.name}</p>
                  <p className="text-sm text-muted-foreground">{editingUser?.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffId">Staff ID</Label>
                <Input
                  id="staffId"
                  placeholder="e.g. CTK-2025-10-14 081"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger title="Select User Role" aria-label="Select User Role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Employee</SelectItem>
                    <SelectItem value="head_of_department">Head of Department</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="head_of_finance">Head of Finance</SelectItem>
                    <SelectItem value="ceo_md">CEO/MD</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editGender" className={validationErrors.gender ? "text-red-500" : ""}>Gender <span className="text-red-500">*</span></Label>
                <Select value={editGender} onValueChange={(val) => {
                  setEditGender(val);
                  if (validationErrors.gender) {
                    setValidationErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.gender;
                      return copy;
                    });
                  }
                }}>
                  <SelectTrigger className={validationErrors.gender ? "border-red-500 focus:ring-red-500" : ""}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.gender && <p className="text-xs text-red-500">{validationErrors.gender}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger aria-label="Select department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerId">Manager ID</Label>
                <Input
                  id="managerId"
                  placeholder="Manager's user ID"
                  type="number"
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPosition">Position</Label>
                <Input
                  id="editPosition"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editProfileImage">Profile Image URL</Label>
                <Input
                  id="editProfileImage"
                  placeholder="https://example.com/photo.jpg"
                  value={editProfileImage}
                  onChange={(e) => setEditProfileImage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPhoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="editPhoneNumber"
                    placeholder="+250..."
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <SingleDatePicker
                    value={editDateOfBirth}
                    onChange={setEditDateOfBirth}
                    label="Select birthday"
                  />
                </div>
                <div className="space-y-2">
                  <Label className={validationErrors.contractType ? "text-red-500" : ""}>Contract Type</Label>
                  <Select value={editContractType} onValueChange={(val) => {
                    setEditContractType(val);
                    if (validationErrors.contractType) {
                      setValidationErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.contractType;
                        return copy;
                      });
                    }
                  }}>
                    <SelectTrigger className={validationErrors.contractType ? "border-red-500 focus:ring-red-500" : ""} aria-label="Select contract type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.contractType && <p className="text-xs text-red-500">{validationErrors.contractType}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={validationErrors.contractStart ? "text-red-500" : ""}>
                    Contract Start {editContractType && <span className="text-red-500">*</span>}
                  </Label>
                  <SingleDatePicker
                    value={editContractStart}
                    onChange={(val) => {
                      setEditContractStart(val);
                      if (validationErrors.contractStart) {
                        setValidationErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.contractStart;
                          return copy;
                        });
                      }
                    }}
                    className={validationErrors.contractStart ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {validationErrors.contractStart && <p className="text-xs text-red-500">{validationErrors.contractStart}</p>}
                </div>
                <div className="space-y-2">
                  <Label className={validationErrors.contractEnd ? "text-red-500" : ""}>
                    Contract End {(editContractType === "Full-time" || editContractType === "Contract") && <span className="text-red-500">*</span>}
                  </Label>
                  <SingleDatePicker
                    value={editContractEnd}
                    onChange={(val) => {
                      setEditContractEnd(val);
                      if (validationErrors.contractEnd) {
                        setValidationErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.contractEnd;
                          return copy;
                        });
                      }
                    }}
                    className={validationErrors.contractEnd ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {validationErrors.contractEnd && <p className="text-xs text-red-500">{validationErrors.contractEnd}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editJobDesc">Job Description</Label>
                <Textarea
                  id="editJobDesc"
                  placeholder="Enter key responsibilities..."
                  className="min-h-25"
                  value={editJobDescription}
                  onChange={(e) => setEditJobDescription(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 min-h-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">User Documents</h4>
                <div className="text-xs text-muted-foreground">Legal & ID verification</div>
              </div>
              <UserDocumentList userId={editingUser?.id} />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateUserMutation.isPending}
              className="bg-accent hover:bg-accent/90"
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-112">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Set a new password for {editingUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-foreground">{editingUser?.name}</p>
                <p className="text-sm text-muted-foreground">{editingUser?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setShowPasswordDialog(false);
              setNewPassword("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (newPassword.length < 6) {
                  toast.error("Password must be at least 6 characters");
                  return;
                }
                await resetPasswordMutation.mutateAsync({
                  userId: editingUser.id,
                  newPassword,
                });
              }}
              disabled={resetPasswordMutation.isPending || newPassword.length < 6}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="max-w-112 border-border/80 bg-card/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-orange-500 flex items-center gap-2">
              <ShieldOff className="h-5 w-5" />
              Deactivate User
            </DialogTitle>
            <DialogDescription>
              Disable system access for {editingUser?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-xs text-orange-400 space-y-2">
              <p className="font-semibold">Consequences of Deactivation:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Immediate revocation of active sessions and tokens</li>
                <li>Excluded from future task assignments and backup pickers</li>
                <li>Subordinate manager assignments will be unlinked</li>
                <li>All historical records and approvals remain intact</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deactivateReason" className="text-xs font-semibold text-muted-foreground">
                Reason for Deactivation <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="deactivateReason"
                placeholder="Enter reason (min 10 characters)..."
                value={lifecycleReason}
                onChange={(e) => setLifecycleReason(e.target.value)}
                className="h-20 resize-none bg-muted/50 border-border"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {lifecycleReason.trim().length}/10 characters minimum
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (lifecycleReason.trim().length < 10) {
                  toast.error("Reason must be at least 10 characters");
                  return;
                }
                await deactivateUserMutation.mutateAsync({
                  userId: editingUser.id,
                  reason: lifecycleReason,
                });
              }}
              disabled={deactivateUserMutation.isPending || lifecycleReason.trim().length < 10}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {deactivateUserMutation.isPending ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate User Dialog */}
      <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <DialogContent className="max-w-112 border-border/80 bg-card/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-500 flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Reactivate User
            </DialogTitle>
            <DialogDescription>
              Restore system access for {editingUser?.name}.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-muted-foreground my-2">
            Are you sure you want to reactivate <strong>{editingUser?.name}</strong>? They will be restored as an active Employee, allowing them to log back in and participate in workflows.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowReactivateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await reactivateUserMutation.mutateAsync({
                  userId: editingUser.id,
                });
              }}
              disabled={reactivateUserMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {reactivateUserMutation.isPending ? "Reactivating..." : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Dialog */}
      <Dialog open={showPermanentDeleteDialog} onOpenChange={setShowPermanentDeleteDialog}>
        <DialogContent className="max-w-112 border-border/80 bg-card/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Permanent Delete
            </DialogTitle>
            <DialogDescription>
              Permanently delete user record for {editingUser?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 space-y-1">
              <p className="font-semibold">Strict System Guardrails:</p>
              <p>This action is ONLY allowed if the user has zero linked activities (no approvals, requests, suggestions, comments, or assets). If database references are found, the system will block deletion.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deleteReason" className="text-xs font-semibold text-muted-foreground">
                Reason for Permanent Deletion <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="deleteReason"
                placeholder="Enter justification (min 10 characters)..."
                value={lifecycleReason}
                onChange={(e) => setLifecycleReason(e.target.value)}
                className="h-20 resize-none bg-muted/50 border-border"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {lifecycleReason.trim().length}/10 characters minimum
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setShowPermanentDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (lifecycleReason.trim().length < 10) {
                  toast.error("Reason must be at least 10 characters");
                  return;
                }
                await permanentDeleteUserMutation.mutateAsync({
                  userId: editingUser.id,
                  reason: lifecycleReason,
                });
              }}
              disabled={permanentDeleteUserMutation.isPending || lifecycleReason.trim().length < 10}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {permanentDeleteUserMutation.isPending ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Anonymize Dialog */}
      <Dialog open={showAnonymizeDialog} onOpenChange={setShowAnonymizeDialog}>
        <DialogContent className="max-w-112 border-border/80 bg-card/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-muted-foreground flex items-center gap-2">
              <UserX className="h-5 w-5 text-gray-500" />
              Anonymize User (Privacy Request)
            </DialogTitle>
            <DialogDescription>
              Scrub PII fields for {editingUser?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Compliance Erasure:</p>
              <p>Replaces name, email, phone number, and avatar with anonymized tokens. The record is soft-deleted, but all historical workflow attribution and database integrity remain completely intact.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anonymizeReason" className="text-xs font-semibold text-muted-foreground">
                Reason / Authority for Erasure <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="anonymizeReason"
                placeholder="Enter privacy compliance reason (min 10 characters)..."
                value={lifecycleReason}
                onChange={(e) => setLifecycleReason(e.target.value)}
                className="h-20 resize-none bg-muted/50 border-border"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {lifecycleReason.trim().length}/10 characters minimum
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setShowAnonymizeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (lifecycleReason.trim().length < 10) {
                  toast.error("Reason must be at least 10 characters");
                  return;
                }
                await anonymizeUserMutation.mutateAsync({
                  userId: editingUser.id,
                  reason: lifecycleReason,
                });
              }}
              disabled={anonymizeUserMutation.isPending || lifecycleReason.trim().length < 10}
              className="bg-gray-600 hover:bg-gray-700 text-white border-none"
            >
              {anonymizeUserMutation.isPending ? "Anonymizing..." : "Anonymize User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        setValidationErrors({});
      }}>
        <DialogContent className="max-w-112 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="createName" className={validationErrors.name ? "text-red-500" : ""}>Full Name <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${validationErrors.name ? "text-red-500" : "text-gray-400"}`} />
                <Input
                  id="createName"
                  placeholder="Enter full name"
                  value={createName}
                  onChange={(e) => {
                    setCreateName(e.target.value);
                    if (validationErrors.name) {
                      setValidationErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.name;
                        return copy;
                      });
                    }
                  }}
                  className={`pl-9 ${validationErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
              </div>
              {validationErrors.name && <p className="text-xs text-red-500">{validationErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="createEmail" className={validationErrors.email ? "text-red-500" : ""}>Email <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${validationErrors.email ? "text-red-500" : "text-gray-400"}`} />
                <Input
                  id="createEmail"
                  type="email"
                  placeholder="user@centrika.rw"
                  value={createEmail}
                  onChange={(e) => {
                    setCreateEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.email;
                        return copy;
                      });
                    }
                  }}
                  className={`pl-9 ${validationErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
              </div>
              {validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="createDepartment" className={validationErrors.department ? "text-red-500" : ""}>Department <span className="text-red-500">*</span></Label>
              <Select 
                value={createDepartmentId} 
                onValueChange={(val) => {
                  setCreateDepartmentId(val);
                  if (validationErrors.department) {
                    setValidationErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.department;
                      return copy;
                    });
                  }
                }}
              >
                <SelectTrigger className={validationErrors.department ? "border-red-500 focus:ring-red-500" : ""} aria-label="Select department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept: any) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.department && <p className="text-xs text-red-500">{validationErrors.department}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="createPosition">Position</Label>
                <Input
                  id="createPosition"
                  placeholder="e.g., Software Engineer"
                  value={createPosition}
                  onChange={(e) => setCreatePosition(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="createProfileImage">Profile Image URL</Label>
                <div className="relative">
                  <Input
                    id="createProfileImage"
                    placeholder="https://example.com/photo.jpg"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="createPhoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="createPhoneNumber"
                    placeholder="+250..."
                    value={createPhoneNumber}
                    onChange={(e) => setCreatePhoneNumber(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

            <div className="space-y-2">
              <Label htmlFor="createDate">Date of Employment</Label>
              <SingleDatePicker
                value={createEmploymentDate}
                onChange={setCreateEmploymentDate}
                label="Pick a date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="createRole">Role</Label>
              <Select value={createRole} onValueChange={setCreateRole}>
                <SelectTrigger aria-label="Select role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Employee</SelectItem>
                  <SelectItem value="head_of_department">Head of Department</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="head_of_finance">Head of Finance</SelectItem>
                  <SelectItem value="ceo_md">CEO/MD</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="createGender" className={validationErrors.gender ? "text-red-500" : ""}>Gender <span className="text-red-500">*</span></Label>
              <Select value={createGender} onValueChange={(val) => {
                setCreateGender(val);
                if (validationErrors.gender) {
                  setValidationErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.gender;
                    return copy;
                  });
                }
              }}>
                <SelectTrigger className={validationErrors.gender ? "border-red-500 focus:ring-red-500" : ""}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.gender && <p className="text-xs text-red-500">{validationErrors.gender}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <SingleDatePicker
                  value={createDateOfBirth}
                  onChange={setCreateDateOfBirth}
                />
              </div>
              <div className="space-y-2">
                <Label className={validationErrors.contractType ? "text-red-500" : ""}>Contract Type</Label>
                <Select value={createContractType} onValueChange={(val) => {
                  setCreateContractType(val);
                  if (validationErrors.contractType) {
                    setValidationErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.contractType;
                      return copy;
                    });
                  }
                }}>
                  <SelectTrigger className={validationErrors.contractType ? "border-red-500 focus:ring-red-500" : ""} aria-label="Select contract type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.contractType && <p className="text-xs text-red-500">{validationErrors.contractType}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={validationErrors.contractStart ? "text-red-500" : ""}>
                  Contract Start {createContractType && <span className="text-red-500">*</span>}
                </Label>
                <SingleDatePicker
                  value={createContractStart}
                  onChange={(val) => {
                    setCreateContractStart(val);
                    if (validationErrors.contractStart) {
                      setValidationErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.contractStart;
                        return copy;
                      });
                    }
                  }}
                  className={validationErrors.contractStart ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {validationErrors.contractStart && <p className="text-xs text-red-500">{validationErrors.contractStart}</p>}
              </div>
              <div className="space-y-2">
                <Label className={validationErrors.contractEnd ? "text-red-500" : ""}>
                  Contract End {(createContractType === "Full-time" || createContractType === "Contract") && <span className="text-red-500">*</span>}
                </Label>
                <SingleDatePicker
                  value={createContractEnd}
                  onChange={(val) => {
                    setCreateContractEnd(val);
                    if (validationErrors.contractEnd) {
                      setValidationErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.contractEnd;
                        return copy;
                      });
                    }
                  }}
                  className={validationErrors.contractEnd ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {validationErrors.contractEnd && <p className="text-xs text-red-500">{validationErrors.contractEnd}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="createJobDesc">Job Description</Label>
              <Textarea
                id="createJobDesc"
                placeholder="Key responsibilities..."
                className="min-h-20"
                value={createJobDescription}
                onChange={(e) => setCreateJobDescription(e.target.value)}
              />
            </div>
{/* 
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> You can grant any role in the system during registration. The selected role will grant immediate access privileges to the user.
              </p>
            </div> */}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const errors: Record<string, string> = {};
                if (!createName.trim()) errors.name = "Full name is required";
                if (!createEmail.trim()) errors.email = "Email address is required";
                else if (!/\S+@\S+\.\S+/.test(createEmail)) errors.email = "Invalid email format";
                else if (!createEmail.trim().toLowerCase().endsWith("@centrika.rw")) {
                  errors.email = "Email must be a company email address (username@centrika.rw)";
                }
                if (!createDepartmentId) errors.department = "Department must be selected";
                if (!createGender) errors.gender = "Gender must be selected";

                if (createContractType) {
                  if (!createContractStart) {
                    errors.contractStart = "Contract Start Date is required when Contract Type is selected";
                  }
                  if ((createContractType === "Full-time" || createContractType === "Contract") && !createContractEnd) {
                    errors.contractEnd = "Contract End Date is required for Full-time or Contract employee types";
                  }
                }

                if (Object.keys(errors).length > 0) {
                  setValidationErrors(errors);
                  return;
                }

                try {
                  await createUserMutation.mutateAsync({
                    name: createName,
                    email: createEmail,
                    departmentId: parseInt(createDepartmentId),
                    position: createPosition,
                    dateOfEmployment: createEmploymentDate,
                    role: createRole as any,
                    dateOfBirth: createDateOfBirth,
                    jobDescription: createJobDescription,
                    contractType: createContractType,
                    contractStart: createContractStart,
                    contractEnd: createContractEnd,
                    gender: createGender,
                    phoneNumber: createPhoneNumber,
                  });
                } catch (error: any) {
                  console.error("Mutation failed:", error);
                  toast.error(error.message || "An unexpected error occurred.");
                }
              }}
              disabled={createUserMutation.isPending || (createUserMutation as any).isLoading}
              className="bg-[#3b6dae] hover:bg-[#2d5385] text-white outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-35"
            >
              {createUserMutation.isPending || (createUserMutation as any).isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Modal */}
      <InviteUserModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onSuccess={() => {
          refetchInvitations();
        }}
      />

      {/* Pending Invitations Section */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
            <CardDescription>Users who have been invited but haven't activated their accounts yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invitation: any) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{invitation.name || invitation.email}</p>
                    <p className="text-xs text-muted-foreground">{invitation.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="text-xs capitalize bg-blue-500/20 text-blue-700 dark:text-blue-300">
                        {invitation.role.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Sent {new Date(invitation.createdAt).toLocaleDateString()} • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resendInvitationMutation.mutate({ invitationId: invitation.id })}
                      disabled={resendInvitationMutation.isPending}
                      className="h-8 gap-1"
                    >
                      <RotateCw className="h-3 w-3" />
                      <span className="text-xs">Resend</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelInvitationMutation.mutate({ invitationId: invitation.id })}
                      disabled={cancelInvitationMutation.isPending}
                      className="h-8 gap-1 text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                      <span className="text-xs">Cancel</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}

function UserDocumentList({ userId }: { userId: number }) {
  const { data: documents, refetch } = (trpc as any).hr.listDocuments.useQuery({ userId }, { enabled: !!userId });
  const verifyMutation = (trpc as any).hr.verifyDocument.useMutation({
    onSuccess: () => {
      toast.success("Document status updated");
      refetch();
    }
  });

  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
        <FileText className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc: any) => (
        <div key={doc.id} className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="bg-[#3b6dae]/10 p-2 rounded">
                <FileText className="h-5 w-5 text-[#3b6dae]" />
              </div>
              <div>
                <p className="text-sm font-medium">{doc.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] py-0">{doc.category}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" title="View document">
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="View document">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
            <div className="flex items-center gap-1.5">
              {doc.status === "verified" ? (
                <div className="flex items-center text-xs text-green-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verified
                </div>
              ) : doc.status === "rejected" ? (
                <div className="flex items-center text-xs text-red-600 font-medium">
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Rejected
                </div>
              ) : (
                <div className="flex items-center text-xs text-amber-600 font-medium">
                  <Clock className="h-3.5 w-3.5 mr-1" /> Pending
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {doc.status !== "verified" && (
                <Button 
                  size="sm" 
                  className="h-7 text-[10px] bg-green-600 hover:bg-green-700"
                  onClick={() => verifyMutation.mutate({ documentId: doc.id, status: "verified" })}
                >
                  Verify
                </Button>
              )}
              {doc.status !== "rejected" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-[10px] text-red-600 hover:text-red-700"
                  onClick={() => verifyMutation.mutate({ documentId: doc.id, status: "rejected" })}
                >
                  Reject
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
