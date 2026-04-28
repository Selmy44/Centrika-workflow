import { useAuth } from "@/_core/hooks/useAuth";
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
import { Loader2, Edit2, Trash2, Plus, Mail, User, RotateCw, X, MoreHorizontal, Key, Phone } from "lucide-react";
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
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  const [validationErrors, setValidationErrors] = useState<{name?: string, email?: string, department?: string, gender?: string}>({});

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

  const deleteUserMutation = (trpc as any).users.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully!");
      setShowDeleteDialog(false);
      setEditingUser(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete user");
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
      ceo_md: { bg: "bg-amber-500/20", text: "text-amber-400" },
    };

    const config = roleConfig[role] || roleConfig.user;
    const label = role.replace(/_/g, " ").toUpperCase();

    return (
      <Badge className={`${config.bg} ${config.text}`}>
        {label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#3b6dae] dark:text-[#c79d2d]">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage user roles and permissions</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Premium animated search bar */}
            <div className="relative group transition-all duration-300 z-10">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3b6dae] to-[#c79d2d] rounded-xl blur opacity-0 group-hover:opacity-20 group-focus-within:opacity-30 transition duration-500"></div>
              <div className="relative flex items-center">
                <svg className="absolute left-3.5 w-4 h-4 text-slate-400 group-focus-within:text-[#3b6dae] transition-colors z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  placeholder="Search users by name, email, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-56 focus:w-80 h-10 pl-10 pr-4 text-xs font-semibold rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-sm focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 focus:ring-2 focus:ring-[#3b6dae]/20 focus:border-[#3b6dae]/40"
                />
              </div>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2 bg-[#3b6dae] hover:bg-[#2d5385] text-white shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#3b6dae] focus-visible:ring-offset-2"
            >
              <User size={16} />
              Create User
            </Button>
            <Button
              onClick={() => setShowInviteModal(true)}
              variant="outline"
              className="gap-2 border-[#3b6dae]/20 text-[#3b6dae] hover:bg-[#3b6dae]/5 transition-all focus-visible:ring-2 focus-visible:ring-[#3b6dae] focus-visible:ring-offset-2"
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
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 shadow-xl border-border/50 backdrop-blur-sm">
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
                              <DropdownMenuSeparator className="bg-border/50" />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setEditingUser(userData);
                                  setShowDeleteDialog(true);
                                }}
                                className="flex items-center gap-2 py-2.5 px-2 rounded-lg cursor-pointer text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="font-medium text-xs">Delete User</span>
                              </DropdownMenuItem>
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
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
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
                    <SelectItem value="head_of_department">Department Head</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="head_of_finance">Head of Finance</SelectItem>
                    <SelectItem value="ceo_md">CEO/MD</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editGender">Gender</Label>
                <Select value={editGender} onValueChange={setEditGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Label>Contract Type</Label>
                  <Select value={editContractType} onValueChange={setEditContractType}>
                    <SelectTrigger aria-label="Select contract type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Start</Label>
                  <SingleDatePicker
                    value={editContractStart}
                    onChange={setEditContractStart}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract End</Label>
                  <SingleDatePicker
                    value={editContractEnd}
                    onChange={setEditContractEnd}
                  />
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

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-112">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete {editingUser?.name}?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Warning:</strong> Deleting this user will remove their account from the system permanently.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await deleteUserMutation.mutateAsync({
                  userId: editingUser.id,
                });
              }}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) { setValidationErrors({}); }
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
                    if (validationErrors.name) setValidationErrors({...validationErrors, name: undefined});
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
                    if (validationErrors.email) setValidationErrors({...validationErrors, email: undefined});
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
                  if (validationErrors.department) setValidationErrors({...validationErrors, department: undefined});
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
                  <SelectItem value="head_of_department">Department Head</SelectItem>
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
                if (validationErrors.gender) setValidationErrors({...validationErrors, gender: undefined});
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
                <Label>Contract Type</Label>
                <Select value={createContractType} onValueChange={setCreateContractType}>
                  <SelectTrigger aria-label="Select contract type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Start</Label>
                <SingleDatePicker
                  value={createContractStart}
                  onChange={setCreateContractStart}
                />
              </div>
              <div className="space-y-2">
                <Label>Contract End</Label>
                <SingleDatePicker
                  value={createContractEnd}
                  onChange={setCreateContractEnd}
                />
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
                const errors: {name?: string, email?: string, department?: string, gender?: string} = {};
                if (!createName.trim()) errors.name = "Full name is required";
                if (!createEmail.trim()) errors.email = "Email address is required";
                else if (!/\S+@\S+\.\S+/.test(createEmail)) errors.email = "Invalid email format";
                if (!createDepartmentId) errors.department = "Department must be selected";
                if (!createGender) errors.gender = "Gender must be selected";

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
