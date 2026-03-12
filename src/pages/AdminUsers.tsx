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
import { trpc } from "@/lib/trpc";
import { Loader2, Edit2, Trash2, Plus, Mail, RotateCw, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InviteUserModal } from "@/components/InviteUserModal";
import SingleDatePicker from "@/components/SingleDatePicker";

export default function AdminUsers() {
  const { isAuthenticated, user } = useAuth();
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

  const { data: users, isLoading, refetch } = (trpc as any).users.listAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: pendingInvitations, refetch: refetchInvitations } = (trpc as any).invitations.getPendingInvitations.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
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
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== "admin" && user?.role !== "hr") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
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
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage user roles and permissions</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Modern compact search bar */}
            <div className="relative">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 h-10 pl-10 text-sm rounded-lg border border-border bg-muted/50 focus:bg-background transition-colors"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2 bg-accent hover:bg-accent/90"
            >
              <Plus size={18} />
              Create User
            </Button>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Mail size={18} />
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
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Manager</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((userData: any) => (
                      <tr key={userData.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-foreground font-medium">{userData.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{userData.email}</td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{userData.staffId || "-"}</td>
                        <td className="py-3 px-4">{getRoleBadge(userData.role)}</td>
                        <td className="py-3 px-4 text-muted-foreground">{userData.department?.name || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {userData.managerId ? `ID: ${userData.managerId}` : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(userData)}
                              className="gap-2"
                            >
                              <Edit2 size={16} />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingUser(userData);
                                setShowPasswordDialog(true);
                              }}
                              className="gap-2"
                            >
                              🔑
                              Reset Password
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setEditingUser(userData);
                                setShowDeleteDialog(true);
                              }}
                              className="gap-2"
                            >
                              <Trash2 size={16} />
                              Delete
                            </Button>
                          </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update role, department, and manager information for {editingUser?.name}
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
              <Label htmlFor="staffId">Staff ID</Label>
              <Input
                id="staffId"
                placeholder="e.g. CTK-2025-10-14 081"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format: CTK-YYYY-MM-DD NNN
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
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
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
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
              <p className="text-xs text-muted-foreground">
                Leave empty if no manager. Set to user ID of the approver.
              </p>
            </div>
          </div>

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
        <DialogContent className="max-w-md">
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
        <DialogContent className="max-w-md">
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
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="createName">Full Name</Label>
              <Input
                id="createName"
                placeholder="Enter full name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="createEmail">Email</Label>
              <Input
                id="createEmail"
                type="email"
                placeholder="user@centrika.rw"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="createDepartment">Department</Label>
              <Select value={createDepartmentId} onValueChange={setCreateDepartmentId}>
                <SelectTrigger>
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
              <Label htmlFor="createPosition">Position</Label>
              <Input
                id="createPosition"
                placeholder="e.g., Software Engineer"
                value={createPosition}
                onChange={(e) => setCreatePosition(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="createDate">Date of Employment</Label>
              <SingleDatePicker
                value={createEmploymentDate}
                onChange={setCreateEmploymentDate}
                label="Pick a date"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> New users are created with Employee role by default. Assign specific roles (Admin, HR, HOD, CEO) only if needed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!createName || !createEmail || !createDepartmentId) {
                  toast.error("Name, email, and department are required");
                  return;
                }

                if (!createEmail.endsWith("@centrika.rw")) {
                  toast.error("Email must be a company email (username@centrika.rw)");
                  return;
                }

                try {
                  await createUserMutation.mutateAsync({
                    name: createName,
                    email: createEmail,
                    departmentId: createDepartmentId ? parseInt(createDepartmentId) : undefined,
                    position: createPosition,
                    dateOfEmployment: createEmploymentDate,
                    role: "user",
                  });
                } catch (error) {
                  console.error(error);
                }
              }}
              disabled={createUserMutation.isPending}
              className="bg-accent hover:bg-accent/90"
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
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
