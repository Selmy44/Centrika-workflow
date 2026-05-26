import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Mail, Shield, Calendar, Loader2, Upload, Building2,
  Users, FileText, Bell, Eye, Database, Lock, Settings as SettingsIcon,
  Clock, Key, ArrowRight, Pencil, Save, X, Phone, Download, Trash2, Search
} from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import SingleDatePicker from "@/components/SingleDatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Settings() {
  const { user, isAuthenticated, hasRole } = useAuth();
  const utils = (trpc as any).useUtils();

  // --- Profile State ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<string>(user?.profileImage || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editDepartmentId, setEditDepartmentId] = useState(user?.departmentId?.toString() || "");
  const [editPosition, setEditPosition] = useState(user?.position || "");
  const [editStaffId, setEditStaffId] = useState(user?.staffId || "");
  const [editDateOfEmployment, setEditDateOfEmployment] = useState(user?.dateOfEmployment || "");
  const [editManagerId, setEditManagerId] = useState(user?.managerId?.toString() || "");
  const [editGender, setEditGender] = useState((user as any)?.gender || "");
  const [editPhoneNumber, setEditPhoneNumber] = useState((user as any)?.phoneNumber || "");

  // --- Password State ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // --- Data ---
  const { data: managers = [] } = (trpc as any).users.listHeads.useQuery();
  const { data: departments = [] } = (trpc as any).employees.getDepartments.useQuery();

  // Mutations
  const updateProfileMutation = (trpc as any).auth.updateProfile.useMutation();
  const changePasswordMutation = (trpc as any).auth.changePassword.useMutation();

  const handleUpdateProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        name: editName,
        email: editEmail,
        departmentId: editDepartmentId ? parseInt(editDepartmentId) : undefined,
        position: editPosition,
        staffId: editStaffId,
        dateOfEmployment: editDateOfEmployment,
        managerId: editManagerId ? parseInt(editManagerId) : null,
        profileImage: profileImage,
        gender: editGender,
        phoneNumber: editPhoneNumber,
      });
      await utils.auth.me.invalidate();
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileImage(event.target?.result as string);
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    setPasswordErrors({});
    const required: Record<string, string> = {};
    if (!currentPassword) required.currentPassword = "Current password is required";
    if (!newPassword) required.newPassword = "New password is required";
    if (!confirmPassword) required.confirmPassword = "Please confirm your new password";
    if (Object.keys(required).length) { setPasswordErrors(required); return; }
    if (newPassword !== confirmPassword) {
      setPasswordErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      // tRPC wraps Zod issues at error.data.zodError.issues
      const issues: Array<{ path: string[]; message: string }> =
        error?.data?.zodError?.issues ??
        error?.shape?.data?.zodError?.issues ??
        (Array.isArray(error?.data) ? error.data : null);

      if (issues?.length) {
        const fieldErrors: Record<string, string> = {};
        issues.forEach((issue) => {
          const field = issue.path?.[0] as string | undefined;
          if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
        });
        setPasswordErrors(fieldErrors);
      } else if (error.data?.zodError?.fieldErrors) {
        const errors = error.data.zodError.fieldErrors;
        const messages = Object.values(errors).flat() as string[];
        toast.error(messages[0] || "Failed to change password");
      } else {
        toast.error(error.message || "Failed to change password");
      }
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 space-y-6">
          <div>
            <h1 className="text-xl font-black text-[#3b6dae] tracking-tight uppercase">Settings</h1>
            <p className="text-[#3b6dae]/50 font-bold text-[10px] mt-0.5 uppercase tracking-widest">Profile & Configuration Console</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-white/40 border border-[#3b6dae]/5 p-1 rounded-xl h-auto backdrop-blur-md flex flex-wrap w-full lg:w-auto lg:inline-flex lg:h-12">
              <TabsTrigger value="profile" className="flex-1 lg:flex-none px-4 gap-2 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#3b6dae] data-[state=active]:text-white transition-all rounded-lg h-10 lg:h-full">
                <User size={14} />
                Profile
              </TabsTrigger>

              <TabsTrigger value="security" className="flex-1 lg:flex-none px-4 gap-2 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#3b6dae] data-[state=active]:text-white transition-all rounded-lg h-10 lg:h-full">
                <Lock size={14} />
                Security
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 lg:flex-none px-4 gap-2 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#3b6dae] data-[state=active]:text-white transition-all rounded-lg h-10 lg:h-full">
                <FileText size={14} />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 focus-visible:outline-none">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between pb-2">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#3b6dae]">Personal Information</h2>
                  <p className="text-xs text-muted-foreground">Manage your personal details and contact information.</p>
                </div>
                {!isEditingProfile ? (
                  <Button onClick={() => setIsEditingProfile(true)} className="bg-[#3b6dae] w-full lg:w-auto hover:bg-[#2d5385] text-white">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex justify-end flex-col w-full gap-2 lg:flex-row items-center gap-2">
                    <Button variant="outline" onClick={() => setIsEditingProfile(false)} className="border-red-200 text-red-600 hover:bg-red-50 w-full lg:w-auto hover:text-red-700">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateProfile} disabled={updateProfileMutation.isPending} className="bg-green-600 hover:bg-green-700 w-full lg:w-auto text-white">
                      {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              <Card className="bg-white border-[#3b6dae]/10 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 lg:p-8 flex flex-col lg:flex-row items-center lg:items-start gap-8">
                    {/* AVATAR SECTION */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group">
                        <Avatar className="h-32 w-32 border-4 border-slate-50 shadow-md">
                          <AvatarImage src={profileImage || user.profileImage || undefined} className="object-cover" />
                          <AvatarFallback className="bg-[#3b6dae] text-white text-4xl font-black">
                            {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isEditingProfile && (
                          <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-2.5 bg-[#c79d2d] text-white rounded-full cursor-pointer hover:bg-[#c79d2d]/90 transition-all shadow-md border-2 border-white">
                            {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <input id="avatar-upload" type="file" className="hidden" onChange={handleProfileImageUpload} accept="image/*" />
                          </label>
                        )}
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-lg text-slate-800 tracking-tight">{user.name}</h3>
                        <Badge variant="secondary" className="mt-1 bg-blue-50 text-blue-700 hover:bg-blue-100">
                          {[user.role, ...(() => {
                            if (!user.additionalRoles) return [];
                            if (typeof user.additionalRoles === 'string') {
                              try {
                                const trimmed = user.additionalRoles.trim();
                                if (trimmed.startsWith('[')) {
                                  const parsed = JSON.parse(trimmed);
                                  return Array.isArray(parsed) ? parsed : [parsed];
                                }
                                return trimmed.split(',').map((r: string) => r.trim()).filter(Boolean);
                              } catch (e) {
                                return [user.additionalRoles];
                              }
                            }
                            return Array.isArray(user.additionalRoles) ? user.additionalRoles : [];
                          })()].join(' & ').replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <Separator orientation="vertical" className="hidden lg:block h-auto min-h-[300px] bg-slate-100" />
                    <Separator orientation="horizontal" className="block lg:hidden bg-slate-100" />

                    {/* FIELDS SECTION */}
                    <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</Label>
                        {isEditingProfile ? (
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-10 border-slate-200 focus:border-[#3b6dae]/50 focus:ring-[#3b6dae]/50 transition-all font-medium" />
                        ) : (
                          <div className="h-10 flex items-center text-slate-900 font-medium px-1">{user.name || "—"}</div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</Label>
                        {isEditingProfile ? (
                          <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" className="h-10 border-slate-200 focus:border-[#3b6dae]/50 focus:ring-[#3b6dae]/50 transition-all font-medium" />
                        ) : (
                          <div className="h-10 flex items-center text-slate-900 font-medium px-1 truncate">{user.email || "—"}</div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation / Title</Label>
                        {isEditingProfile ? (
                          <Input value={editPosition} onChange={(e) => setEditPosition(e.target.value)} className="h-10 border-slate-200 focus:border-[#3b6dae]/50 focus:ring-[#3b6dae]/50 transition-all font-medium" />
                        ) : (
                          <div className="h-10 flex items-center text-slate-900 font-medium px-1">{user.position || "—"}</div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</Label>
                        {isEditingProfile ? (
                          <Select onValueChange={setEditDepartmentId} value={editDepartmentId?.toString()}>
                            <SelectTrigger className="h-10 border-slate-200 font-medium">
                              <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {departments?.map((d: any) => (
                                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="h-10 flex items-center text-slate-900 font-medium px-1">
                            {departments?.find((d: any) => d.id === user?.departmentId)?.name || "—"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff ID</Label>
                        {isEditingProfile ? (
                          <Input value={editStaffId} onChange={(e) => setEditStaffId(e.target.value)} className="h-10 border-slate-200 focus:border-[#3b6dae]/50 focus:ring-[#3b6dae]/50 transition-all font-medium" />
                        ) : (
                          <div className="h-10 flex items-center text-slate-900 font-medium px-1">{user.staffId || "—"}</div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</Label>
                        {isEditingProfile ? (
                          <Select onValueChange={setEditGender} value={editGender}>
                            <SelectTrigger className="h-10 border-slate-200 font-medium">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="h-10 flex items-center text-slate-900 font-medium px-1 capitalize">{((user as any)?.gender) || "—"}</div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date of Employment</Label>
                        {isEditingProfile ? (
                          <SingleDatePicker value={editDateOfEmployment} onChange={setEditDateOfEmployment} label="Select Date" className="h-10 border-slate-200 font-medium" />
                        ) : (
                          <div className="h-10 flex items-center text-slate-900 font-medium px-1">
                            {user.dateOfEmployment ? new Date(user.dateOfEmployment).toLocaleDateString() : "—"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telephone Number</Label>
                        {isEditingProfile ? (
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="+250..." value={editPhoneNumber} onChange={(e) => setEditPhoneNumber(e.target.value)} className="h-10 pl-9 border-slate-200 focus:border-[#3b6dae]/50 focus:ring-[#3b6dae]/50 transition-all font-medium" />
                          </div>
                        ) : (
                          <div className="h-10 flex items-center text-slate-900 font-medium px-1">{(user as any)?.phoneNumber || "—"}</div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Line Manager / HOD</Label>
                        {isEditingProfile ? (
                          <Select onValueChange={setEditManagerId} value={editManagerId?.toString()}>
                            <SelectTrigger className="h-10 border-slate-200 font-medium">
                              <SelectValue placeholder="Select Manager" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {managers?.map((m: any) => (
                                <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="h-10 flex items-center text-slate-900 font-medium px-1">
                            {managers?.find((m: any) => m.id === user?.managerId)?.name || "—"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>



            <TabsContent value="security" className="space-y-6 flex items-center justify-center focus-visible:outline-none">
              <Card className="bg-white/50 border-[#3b6dae]/5 rounded-xl shadow-sm max-w-2xl">
                <CardHeader className="bg-[#3b6dae]/5 border-b border-[#3b6dae]/5 py-3">
                  <CardTitle className="text-[#3b6dae] text-lg font-black uppercase tracking-tighter">Credential Management</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Update your account password regularly to maintain security.</p>
                  <div className="space-y-3">
                    <div>
                      <PasswordInput label="Current Password" value={currentPassword} onChange={(v) => { setCurrentPassword(v); setPasswordErrors((e) => ({ ...e, currentPassword: "" })); }} />
                      {passwordErrors.currentPassword && <p className="text-xs text-red-500 mt-1 font-medium">{passwordErrors.currentPassword}</p>}
                    </div>
                    <div>
                      <PasswordInput label="New Password" value={newPassword} onChange={(v) => { setNewPassword(v); setPasswordErrors((e) => ({ ...e, newPassword: "" })); }} />
                      {passwordErrors.newPassword && <p className="text-xs text-red-500 mt-1 font-medium">{passwordErrors.newPassword}</p>}
                    </div>
                    <div>
                      <PasswordInput label="Confirm Password" value={confirmPassword} onChange={(v) => { setConfirmPassword(v); setPasswordErrors((e) => ({ ...e, confirmPassword: "" })); }} />
                      {passwordErrors.confirmPassword && <p className="text-xs text-red-500 mt-1 font-medium">{passwordErrors.confirmPassword}</p>}
                    </div>
                  </div>
                  <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending} className="bg-[#3b6dae] hover:bg-[#2d5385] w-full lg:w-auto  px-8 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-[#3b6dae]/20 transition-all">
                    Update Password
                  </Button>
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="documents" className="space-y-6 focus-visible:outline-none">
              <Card className="bg-white/50 border-[#3b6dae]/5 rounded-xl shadow-sm">
                <CardHeader className="bg-[#3b6dae]/5 border-b border-[#3b6dae]/5 py-3">
                  <CardTitle className="text-[#3b6dae] text-lg font-black uppercase tracking-tighter">Legal Documents</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="bg-[#3b6dae]/5 p-4 rounded-xl border border-[#3b6dae]/10">
                    <h3 className="text-xs font-black text-[#3b6dae] uppercase mb-2">Upload New Document</h3>
                    <DocumentUploadForm />
                  </div>

                  <Separator className="bg-[#3b6dae]/5" />

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-[#3b6dae]/60 uppercase tracking-widest">Your Uploaded Documents</h3>
                    <UserDocumentsTable />
                  </div>

                  <Separator className="bg-[#3b6dae]/5" />

                  <div className="space-y-4">
                    <UserDocumentsPdfConverter />
                  </div>

                  {(hasRole("admin") || hasRole("hr") || hasRole("head_of_department") || hasRole("ceo_md")) && (
                    <>
                      <Separator className="bg-[#3b6dae]/5" />
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-[#3b6dae]/60 uppercase tracking-widest">All Employees Documents</h3>
                        <AllEmployeesDocumentsTable />
                      </div>

                      <Separator className="bg-[#3b6dae]/5" />

                      <div className="space-y-4">
                        <AllEmployeesPdfConverter />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
      </div>
    </DashboardLayout>
  );
}

function DocumentUploadForm() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("ID_PASSPORT");
  const [file, setFile] = useState<File | null>(null);
  const utils = (trpc as any).useUtils();

  const uploadMutation = (trpc as any).hr.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      setName("");
      setFile(null);
      utils.hr.listDocuments.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Upload failed");
    }
  });

  const handleUpload = async () => {
    if (!name || !file) {
      toast.error("Please provide document name and select a file");
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Content = e.target?.result as string;
        const fileKey = `${user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        
        uploadMutation.mutate({
          userId: user.id,
          name,
          category,
          fileUrl: base64Content, // Store as data URL
          fileKey: fileKey,
        });
      } catch (error) {
        toast.error("Failed to read file");
      }
    };
    
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="space-y-1.5">
        <Label className="text-[9px] font-black text-[#3b6dae]/40 uppercase tracking-widest">Document Name</Label>
        <Input 
          placeholder="e.g. Identity Card" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="h-9 bg-white border-[#3b6dae]/10 font-bold text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[9px] font-black text-[#3b6dae]/40 uppercase tracking-widest">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 bg-white border-[#3b6dae]/10 font-bold text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="ID_PASSPORT">ID / Passport</SelectItem>
            <SelectItem value="CONTRACT">Signed Contract</SelectItem>
            <SelectItem value="ACADEMIC_CERTIFICATE">Academic Certificate</SelectItem>
            <SelectItem value="OTHER">Other Legal Document</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[9px] font-black text-[#3b6dae]/40 uppercase tracking-widest">File selection</Label>
        <div className="flex flex-col lg:flex-row items-center gap-2">
          <Input 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="h-9 bg-white border-[#3b6dae]/10 text-[10px] file:bg-[#3b6dae] file:text-white file:border-none file:px-2 file:h-full file:mr-2"
          />
          <Button 
            onClick={handleUpload} 
            disabled={uploadMutation.isPending}
            className="bg-[#3b6dae] hover:bg-[#2d5385] h-9 px-4 w-full lg:w-auto rounded-lg font-black uppercase text-[9px]"
          >
            {uploadMutation.isPending ? <Loader2 className="animate-spin h-3 w-3" /> : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DocumentViewer({ doc, onClose, onDownload }: { doc: any; onClose: () => void; onDownload: (doc: any) => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!doc?.fileUrl) return;
    
    // Fix existing broken DO spaces URLs with SSL issues due to dot-separated bucket name
    let safeUrl = doc.fileUrl;
    if (safeUrl.includes(".digitaloceanspaces.com") && safeUrl.includes("www.xentripay.com.")) {
      safeUrl = safeUrl.replace(
        "www.xentripay.com.nyc3.digitaloceanspaces.com", 
        "nyc3.digitaloceanspaces.com/www.xentripay.com"
      );
    }

    if (safeUrl.startsWith("data:")) {
      fetch(safeUrl)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        })
        .catch(err => {
          console.error("Failed to parse data URL:", err);
          setBlobUrl(safeUrl); // Fallback
        });
    } else {
      // Fetch external URL as blob to bypass Content-Disposition: attachment
      fetch(safeUrl)
        .then(res => res.blob())
        .then(blob => {
          const isPdf = safeUrl.toLowerCase().includes('.pdf');
          const finalBlob = isPdf ? new Blob([blob], { type: 'application/pdf' }) : blob;
          const url = URL.createObjectURL(finalBlob);
          setBlobUrl(url);
        })
        .catch(err => {
          console.error("Failed to fetch document as blob:", err);
          setBlobUrl(safeUrl); // Fallback to direct URL if CORS fails
        });
    }
    return () => {
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [doc]);

  const isImageUrl = (url: string) => {
    if (!url) return false;
    if (url.startsWith("data:image/")) return true;
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url);
  };

  const isValidUrl = (url: string) => {
    if (!url) return false;
    if (url.startsWith("data:") || url.startsWith("blob:")) return true;
    try {
      const parsed = new URL(url);
      return !parsed.hostname.includes("example.com") && !parsed.hostname.includes("example.org");
    } catch { return false; }
  };

  return (
    <Dialog open={!!doc} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="!max-w-6xl !w-[85vw] h-[85vh] p-0 border border-[#3b6dae]/20 rounded-2xl overflow-hidden flex flex-col bg-white/95 backdrop-blur-2xl shadow-[0_30px_100px_-15px_rgba(59,109,174,0.15)]">
        <DialogTitle className="sr-only">Document Viewer</DialogTitle>
        <DialogDescription className="sr-only">Viewing document {doc?.name}</DialogDescription>
        
        {/* Crisp, clean system-white header with blue accents */}
        <div className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0 z-10 relative">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-[#3b6dae]/10 rounded-2xl flex items-center justify-center text-[#3b6dae] shadow-sm">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">{doc?.name}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {doc?.user?.name ? `${doc.user.name} — ` : ""}
                {(doc?.category || "").replace("_", " ")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => onDownload(doc)} className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest bg-[#3b6dae] hover:bg-[#2d5385] text-white border-none transition-all shadow-lg shadow-[#3b6dae]/20">
              <Download size={14} className="mr-2" /> Download
            </Button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
              <X size={22} />
            </Button>
          </div>
        </div>

        {/* Viewer Area - Minimalist light gray background */}
        <div className="flex-1 overflow-hidden bg-slate-50 flex items-center justify-center relative p-0">
          {!blobUrl ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                <Loader2 className="h-7 w-7 animate-spin text-[#3b6dae]" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preparing Document...</p>
            </div>
          ) : !isValidUrl(blobUrl) ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center shadow-sm border border-red-100">
                <FileText size={32} className="text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Document Unavailable</p>
                <p className="text-xs font-bold text-slate-500">This document could not be loaded securely.</p>
              </div>
            </div>
          ) : isImageUrl(doc?.fileUrl || "") ? (
            <div className="w-full h-full p-8 flex items-center justify-center">
              <img src={blobUrl} alt={doc?.name} className="max-w-full max-h-full object-contain rounded-xl shadow-xl ring-1 ring-slate-200/50" />
            </div>
          ) : (
            <iframe src={blobUrl} className="w-full h-full border-none bg-white" title="Document Viewer" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


function UserDocumentsTable() {
  const { user } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
  const utils = (trpc as any).useUtils();
  const { data: documents, isLoading } = (trpc as any).hr.listDocuments.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const deleteMutation = (trpc as any).hr.deleteDocument.useMutation({
    onSuccess: () => { toast.success("Document deleted"); setDeleteDocId(null); utils.hr.listDocuments.invalidate(); },
    onError: (err: any) => toast.error(err.message || "Failed to delete"),
  });

  const isImageUrl = (url: string) => {
    if (!url) return false;
    if (url.startsWith("data:image/")) return true;
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url);
  };

  const isPdfUrl = (url: string) => {
    if (!url) return false;
    if (url.startsWith("data:application/pdf")) return true;
    return /\.pdf(\?|$)/i.test(url);
  };

  const isValidUrl = (url: string) => {
    if (!url) return false;
    if (url.startsWith("data:")) return true;
    try {
      const parsed = new URL(url);
      return !parsed.hostname.includes("example.com") && !parsed.hostname.includes("example.org");
    } catch { return false; }
  };

  const handleDownloadActual = (doc: any) => {
    let safeUrl = doc.fileUrl;
    if (safeUrl && safeUrl.includes(".digitaloceanspaces.com") && safeUrl.includes("www.xentripay.com.")) {
      safeUrl = safeUrl.replace(
        "www.xentripay.com.nyc3.digitaloceanspaces.com", 
        "nyc3.digitaloceanspaces.com/www.xentripay.com"
      );
    }
    const link = document.createElement("a");
    link.href = safeUrl;
    link.target = "_blank";
    link.download = doc.name || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  };

  if (isLoading) return <Loader2 className="animate-spin h-8 w-8 mx-auto text-[#3b6dae]" />;

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-10 bg-white/30 rounded-2xl border-2 border-dashed border-[#3b6dae]/5">
        <FileText className="mx-auto h-10 w-10 text-[#3b6dae]/20 mb-2" />
        <p className="text-[10px] font-bold text-[#3b6dae]/40 uppercase tracking-widest">No documents found in registry</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc: any) => (
          <div key={doc.id} className="flex flex-col lg:flex-row items-center justify-between p-3 bg-white/40 rounded-xl border border-[#3b6dae]/5 hover:bg-white/60 transition-all">
            <div className="flex flex-col lg:flex-row items-center gap-3">
              <div className="h-8 w-8 bg-[#3b6dae]/10 rounded-lg flex items-center justify-center text-[#3b6dae]">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-xs font-black text-[#3b6dae] leading-none mb-1">{doc.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{doc.category.replace('_', ' ')}</span>
                  <span className="text-[8px] text-slate-300">•</span>
                  <span className="text-[9px] font-bold text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-[#3b6dae] hover:bg-[#3b6dae]/10 rounded-lg" onClick={() => setSelectedDoc(doc)} title="View">
                <Eye size={15} />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-[#c79d2d] hover:bg-[#c79d2d]/10 rounded-lg" onClick={() => handleDownloadActual(doc)} title="Download">
                <Download size={15} />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-50 rounded-lg" onClick={() => setDeleteDocId(doc.id)} title="Delete">
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      {deleteDocId && (
        <Dialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-black text-slate-800">Delete Document?</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">This action cannot be undone. The document will be permanently removed.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteDocId(null)} className="rounded-lg text-xs font-bold">Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ documentId: deleteDocId })} disabled={deleteMutation.isPending} className="rounded-lg text-xs font-bold bg-red-500 hover:bg-red-600">
                {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : null} Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Document Viewer */}
      <DocumentViewer doc={selectedDoc} onClose={() => setSelectedDoc(null)} onDownload={handleDownloadActual} />
    </>
  );
}

function AllEmployeesDocumentsTable() {
  const { hasRole } = useAuth();
  const [searchUser, setSearchUser] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
  const utils = (trpc as any).useUtils();
  
  const { data: documents, isLoading } = (trpc as any).hr.listAllDocuments.useQuery(
    { status: "", category: "" },
    { enabled: hasRole("admin") || hasRole("hr") || hasRole("head_of_department") || hasRole("ceo_md") }
  );

  const deleteMutation = (trpc as any).hr.deleteDocument.useMutation({
    onSuccess: () => { toast.success("Document deleted"); setDeleteDocId(null); utils.hr.listAllDocuments.invalidate(); },
    onError: (err: any) => toast.error(err.message || "Failed to delete"),
  });

  const isImageUrl = (url: string) => {
    if (!url) return false;
    if (url.startsWith("data:image/")) return true;
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url);
  };

  const isValidUrl = (url: string) => {
    if (!url) return false;
    if (url.startsWith("data:")) return true;
    try {
      const parsed = new URL(url);
      return !parsed.hostname.includes("example.com") && !parsed.hostname.includes("example.org");
    } catch { return false; }
  };

  const handleDownloadActual = (doc: any) => {
    let safeUrl = doc.fileUrl;
    if (safeUrl && safeUrl.includes(".digitaloceanspaces.com") && safeUrl.includes("www.xentripay.com.")) {
      safeUrl = safeUrl.replace(
        "www.xentripay.com.nyc3.digitaloceanspaces.com", 
        "nyc3.digitaloceanspaces.com/www.xentripay.com"
      );
    }
    const link = document.createElement("a");
    link.href = safeUrl;
    link.target = "_blank";
    link.download = doc.name || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  };

  if (!hasRole("admin") && !hasRole("hr") && !hasRole("head_of_department") && !hasRole("ceo_md")) return null;
  if (isLoading) return <Loader2 className="animate-spin h-8 w-8 mx-auto text-[#3b6dae]" />;

  const filteredDocuments = (documents || []).filter((doc: any) =>
    !searchUser.trim() || doc.user?.name?.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-10 bg-white/30 rounded-2xl border-2 border-dashed border-[#3b6dae]/5">
        <FileText className="mx-auto h-10 w-10 text-[#3b6dae]/20 mb-2" />
        <p className="text-[10px] font-bold text-[#3b6dae]/40 uppercase tracking-widest">No documents found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Premium animated search bar */}
        <div className="relative group transition-all duration-300 z-10 w-full">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3b6dae] to-[#c79d2d] rounded-xl blur opacity-0 group-hover:opacity-20 group-focus-within:opacity-30 transition duration-500"></div>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 group-focus-within:text-[#3b6dae] transition-colors z-10" />
            <Input
              placeholder="Search by employee name..."
              className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 backdrop-blur-md shadow-sm focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 focus:ring-2 focus:ring-[#3b6dae]/20 focus:border-[#3b6dae]/40"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          {filteredDocuments.length === 0 && (
            <p className="text-center text-[10px] font-bold text-[#3b6dae]/40 uppercase tracking-widest py-6">No results for "{searchUser}"</p>
          )}
          {filteredDocuments.map((doc: any) => (
            <div key={doc.id} className="flex flex-col lg:flex-row items-center justify-between p-3 bg-white/40 rounded-xl border border-[#3b6dae]/5 hover:bg-white/60 transition-all">
              <div className="flex flex-col lg:flex-row items-center gap-3 flex-1">
                <div className="h-8 w-8 bg-[#3b6dae]/10 rounded-lg flex items-center justify-center text-[#3b6dae] shrink-0"><FileText size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-black text-[#3b6dae] truncate">{doc.name}</p>
                    <span className="text-[8px] text-slate-300 shrink-0">•</span>
                    <p className="text-xs font-bold text-slate-600 truncate">{doc.user?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{doc.category.replace('_', ' ')}</span>
                    <span className="text-[8px] text-slate-300">•</span>
                    <span className="text-[9px] font-bold text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-[#3b6dae] hover:bg-[#3b6dae]/10 rounded-lg" onClick={() => setSelectedDoc(doc)} title="View">
                  <Eye size={15} />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-[#c79d2d] hover:bg-[#c79d2d]/10 rounded-lg" onClick={() => handleDownloadActual(doc)} title="Download">
                  <Download size={15} />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-50 rounded-lg" onClick={() => setDeleteDocId(doc.id)} title="Delete">
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteDocId && (
        <Dialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-black text-slate-800">Delete Document?</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">This action cannot be undone. The document will be permanently removed.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteDocId(null)} className="rounded-lg text-xs font-bold">Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ documentId: deleteDocId })} disabled={deleteMutation.isPending} className="rounded-lg text-xs font-bold bg-red-500 hover:bg-red-600">
                {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : null} Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Document Viewer */}
      <DocumentViewer doc={selectedDoc} onClose={() => setSelectedDoc(null)} onDownload={handleDownloadActual} />
    </>
  );
}
function UserDocumentsPdfConverter() {
  return null;
}

function AllEmployeesPdfConverter() {
  return null;
}
