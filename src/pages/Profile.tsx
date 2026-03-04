import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Shield, Calendar, Loader2, Upload, Building2, Users, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormatter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import SingleDatePicker from "@/components/SingleDatePicker";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [profileImage, setProfileImage] = useState<string>(user?.profileImage || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Edit profile form
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editDepartment, setEditDepartment] = useState(user?.department || "");
  const [editPosition, setEditPosition] = useState(user?.position || "");
  const [editStaffId, setEditStaffId] = useState(user?.staffId || "");
  const [editDateOfEmployment, setEditDateOfEmployment] = useState(user?.dateOfEmployment || "");
  const [editManagerId, setEditManagerId] = useState(user?.managerId?.toString() || "");

  // Change password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete account form
  const [deletePassword, setDeletePassword] = useState("");

  const { data: managers = [] } = trpc.users.listHeads.useQuery();
  
  const uniqueManagers = Array.from(
    new Map(managers.map(m => [m.id, m])).values()
  );

  // Mutations
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const changePasswordMutation = trpc.auth.changePassword.useMutation();
  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation();
  const utils = trpc.useUtils();

  const handleEditProfile = async () => {
    if (!editName || !editEmail || !editDepartment || !editPosition || !editStaffId || !editDateOfEmployment || !editManagerId) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        name: editName,
        email: editEmail,
        department: editDepartment,
        position: editPosition,
        staffId: editStaffId,
        dateOfEmployment: editDateOfEmployment,
        managerId: parseInt(editManagerId),
        profileImage: profileImage,
      });
      await utils.auth.me.invalidate();
      toast.success("Profile updated successfully!");
      setShowEditDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProfileImage(dataUrl);
      setUploadingImage(false);
      toast.success("Profile image ready. Click 'Save Profile Image' to save.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileImage = async () => {
    if (!profileImage) {
      toast.error("Please upload an image first");
      return;
    }

    try {
      setUploadingImage(true);
      await updateProfileMutation.mutateAsync({
        name: user?.name || editName,
        email: user?.email || editEmail,
        department: user?.department || editDepartment,
        position: user?.position || editPosition,
        staffId: user?.staffId || editStaffId,
        dateOfEmployment: user?.dateOfEmployment || editDateOfEmployment,
        managerId: user?.managerId || parseInt(editManagerId),
        profileImage: profileImage,
      });
      await utils.auth.me.invalidate();
      toast.success("Profile image saved successfully!");
      setUploadingImage(false);
    } catch (error: any) {
      setUploadingImage(false);
      toast.error(error.message || "Failed to save profile image");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password");
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync({
        password: deletePassword,
        confirm: true,
      });
      toast.success("Account deleted successfully");
      await logout();
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-2">View and manage your profile information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your personal information and account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={(profileImage || user.profileImage) || ""} alt={user.name || "User"} />
                      <AvatarFallback className="text-2xl font-semibold bg-blue-500 text-white">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="profile-image-upload"
                      className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 rounded-full p-2 cursor-pointer transition-colors"
                    >
                      <Upload size={16} className="text-white" />
                      <input
                        id="profile-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">{user.position || "Position not set"}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <User size={16} />
                        <span>Full Name</span>
                      </div>
                      <p className="text-foreground font-medium">{user.name || "Not provided"}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail size={16} />
                        <span>Email Address</span>
                      </div>
                      <p className="text-foreground font-medium">{user.email || "Not provided"}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Building2 size={16} />
                        <span>Department</span>
                      </div>
                      <p className="text-foreground font-medium">{user.department || "Not provided"}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <FileText size={16} />
                        <span>Position</span>
                      </div>
                      <p className="text-foreground font-medium">{user.position || "Not provided"}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Shield size={16} />
                        <span>Staff ID</span>
                      </div>
                      <p className="text-foreground font-medium">{user.staffId || "Not provided"}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar size={16} />
                        <span>Date of Employment</span>
                      </div>
                      <p className="text-foreground font-medium">{user.dateOfEmployment ? new Date(user.dateOfEmployment).toLocaleDateString() : "Not provided"}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Users size={16} />
                        <span>Head of Department</span>
                      </div>
                      <p className="text-foreground font-medium">Assigned via managerId</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Shield size={16} />
                        <span>Role</span>
                      </div>
                      <Badge
                        className={
                          user.role === "admin"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : user.role === "head_of_department"
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }
                      >
                        {user.role === "admin" ? "Administrator" : user.role === "head_of_department" ? "Head of Department" : "User"}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar size={16} />
                        <span>Last Sign In</span>
                      </div>
                      <p className="text-foreground font-medium">
                        {user.lastSignedIn ? formatDateTime(user.lastSignedIn) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Edit Profile</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800/50 border-slate-700 backdrop-blur w-screen max-w-7xl max-h-[95vh] overflow-y-auto p-10">
                      <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-bold text-white">Edit Profile</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium mt-2">
                          Update your personal and employment information
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Email - Full Width */}
                        <div className="space-y-2">
                          <Label htmlFor="edit-email" className="text-slate-200 font-semibold text-sm">
                            Email Address
                          </Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 hover:bg-slate-700/70 transition-colors h-10 text-sm"
                          />
                        </div>

                        {/* Full Name - Full Width */}
                        <div className="space-y-2">
                          <Label htmlFor="edit-name" className="text-slate-200 font-semibold text-sm">
                            Full Name
                          </Label>
                          <Input
                            id="edit-name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 hover:bg-slate-700/70 transition-colors h-10 text-sm"
                          />
                        </div>

                        {/* Two Column: Department & Position */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="edit-department" className="text-slate-200 font-semibold text-sm">
                              Department
                            </Label>
                            <Select value={editDepartment} onValueChange={setEditDepartment}>
                              <SelectTrigger id="edit-department" className="bg-slate-700/50 border-slate-600 text-white h-10 text-sm hover:bg-slate-700/70 transition-colors focus:border-blue-500">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="IT" className="text-white">IT</SelectItem>
                                <SelectItem value="Operations" className="text-white">Operations</SelectItem>
                                <SelectItem value="Finance" className="text-white">Finance</SelectItem>
                                <SelectItem value="Administration" className="text-white">Administration</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-position" className="text-slate-200 font-semibold text-sm">
                              Position
                            </Label>
                            <Input
                              id="edit-position"
                              value={editPosition}
                              onChange={(e) => setEditPosition(e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 hover:bg-slate-700/70 transition-colors h-10 text-sm"
                            />
                          </div>
                        </div>

                        {/* Two Column: Staff ID & Employment Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="edit-staffId" className="text-slate-200 font-semibold text-sm">
                              Staff ID
                            </Label>
                            <Input
                              id="edit-staffId"
                              value={editStaffId}
                              onChange={(e) => setEditStaffId(e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 hover:bg-slate-700/70 transition-colors h-10 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-dateOfEmployment" className="text-slate-200 font-semibold text-sm">
                              Date of Employment
                            </Label>
                            <SingleDatePicker
                              value={editDateOfEmployment}
                              onChange={setEditDateOfEmployment}
                              label="Employment Date"
                            />
                          </div>
                        </div>

                        {/* Head of Department - Full Width */}
                        <div className="space-y-2">
                          <Label htmlFor="edit-managerId" className="text-slate-200 font-semibold text-sm">
                            Head of Department
                          </Label>
                          <Select value={editManagerId} onValueChange={setEditManagerId}>
                            <SelectTrigger id="edit-managerId" className="bg-slate-700/50 border-slate-600 text-white h-10 text-sm hover:bg-slate-700/70 focus:border-blue-500 transition-all duration-200">
                              <SelectValue placeholder="Select HOD" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {uniqueManagers && uniqueManagers.length > 0 ? (
                                uniqueManagers.map((manager: any) => (
                                  <SelectItem key={manager.id} value={manager.id.toString()} className="text-white">
                                    {manager.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-slate-400">No HODs available</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-4 justify-end pt-10 border-t border-slate-700">
                        <Button variant="outline" onClick={() => setShowEditDialog(false)} className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 h-10 px-6 text-sm">
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleEditProfile} 
                          disabled={updateProfileMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 text-sm"
                        >
                          {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Change Password</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>Update your password to keep your account secure</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <PasswordInput
                          label="Current Password"
                          value={currentPassword}
                          onChange={setCurrentPassword}
                          placeholder="Enter your current password"
                          id="current-password"
                        />
                        <PasswordInput
                          label="New Password"
                          value={newPassword}
                          onChange={setNewPassword}
                          placeholder="Enter new password"
                          id="new-password"
                        />
                        <PasswordInput
                          label="Confirm Password"
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                          placeholder="Confirm new password"
                          id="confirm-password"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleChangePassword} 
                          disabled={changePasswordMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Update Password
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    onClick={handleSaveProfileImage}
                    disabled={uploadingImage || !profileImage}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {uploadingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Profile Image
                  </Button>

                  <Button 
                    onClick={async () => {
                      try {
                        setUploadingImage(true);
                        await updateProfileMutation.mutateAsync({
                          name: user?.name || editName,
                          email: user?.email || editEmail,
                          department: user?.department || editDepartment,
                          position: user?.position || editPosition,
                          staffId: user?.staffId || editStaffId,
                          dateOfEmployment: user?.dateOfEmployment || editDateOfEmployment,
                          managerId: user?.managerId || parseInt(editManagerId),
                          profileImage: "",
                        });
                        await utils.auth.me.invalidate();
                        setProfileImage("");
                        toast.success("Profile image removed successfully!");
                        setUploadingImage(false);
                      } catch (error: any) {
                        setUploadingImage(false);
                        toast.error(error.message || "Failed to remove profile image");
                      }
                    }}
                    disabled={uploadingImage || !user?.profileImage}
                    variant="destructive"
                  >
                    Remove Profile Picture
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-medium">
                    {user.createdAt ? formatDateTime(user.createdAt) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Login Method</span>
                  <span className="text-sm font-medium capitalize">{user.loginMethod || "OAuth"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                  Download My Data
                </Button>
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete Account
                  </Button>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4 pt-4">
                        <p>
                          This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        </p>
                        <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-md">
                          <p className="text-sm font-medium text-destructive">
                            Warning: All requests and associated data will be deleted.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delete-password" className="text-foreground">
                            Enter your password to confirm
                          </Label>
                          <Input
                            id="delete-password"
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="bg-input border-border"
                            placeholder="Your password"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-2 justify-end">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteAccountMutation.isPending || !deletePassword}
                      >
                        {deleteAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Account
                      </Button>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
