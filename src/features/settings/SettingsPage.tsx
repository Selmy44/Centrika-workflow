import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { PdfConverterCard } from "@/components/PdfConverterCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Mail, Shield, Calendar, Loader2, Upload, Building2,
  Users, FileText, Bell, Eye, Database, Lock, Settings as SettingsIcon,
  Clock, Key, ArrowRight, Pencil, Save, X, Phone
} from "lucide-react";
import { useState } from "react";
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
  const utils = trpc.useUtils();

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

  // --- Data ---
  const { data: managers = [] } = trpc.users.listHeads.useQuery();
  const { data: departments = [] } = (trpc as any).employees.getDepartments.useQuery();

  // Mutations
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const changePasswordMutation = trpc.auth.changePassword.useMutation();
  const updateSettingsMutation = trpc.auth.updateSettings.useMutation();

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
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
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
            <TabsList className="bg-white/40 border border-[#3b6dae]/5 p-1 rounded-xl h-12 backdrop-blur-md inline-flex">
              <TabsTrigger value="profile" className="px-4 gap-2 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#3b6dae] data-[state=active]:text-white transition-all rounded-lg h-full">
                <User size={14} />
                Profile
              </TabsTrigger>

              <TabsTrigger value="security" className="px-4 gap-2 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#3b6dae] data-[state=active]:text-white transition-all rounded-lg h-full">
                <Lock size={14} />
                Security
              </TabsTrigger>
              <TabsTrigger value="documents" className="px-4 gap-2 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#3b6dae] data-[state=active]:text-white transition-all rounded-lg h-full">
                <FileText size={14} />
                Documents
              </TabsTrigger>
              {user.role === 'admin' && (
                <TabsTrigger value="system" className="px-4 gap-2 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#3b6dae] data-[state=active]:text-white transition-all rounded-lg h-full">
                  <SettingsIcon size={12} /> System
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile" className="space-y-4 focus-visible:outline-none">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#3b6dae]">Personal Information</h2>
                  <p className="text-xs text-muted-foreground">Manage your personal details and contact information.</p>
                </div>
                {!isEditingProfile ? (
                  <Button onClick={() => setIsEditingProfile(true)} className="bg-[#3b6dae] hover:bg-[#2d5385] text-white">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsEditingProfile(false)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateProfile} disabled={updateProfileMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                      {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              <Card className="bg-white border-[#3b6dae]/10 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* AVATAR SECTION */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group">
                        <Avatar className="h-32 w-32 border-4 border-slate-50 shadow-md">
                          <AvatarImage src={user.profileImage ?? undefined} className="object-cover" />
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
                          {[user.role, ...(user.additionalRoles ? JSON.parse(user.additionalRoles) : [])].join(' & ').replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <Separator orientation="vertical" className="hidden md:block h-auto min-h-[300px] bg-slate-100" />
                    <Separator orientation="horizontal" className="block md:hidden bg-slate-100" />

                    {/* FIELDS SECTION */}
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
                          <Input type="date" value={editDateOfEmployment} onChange={(e) => setEditDateOfEmployment(e.target.value)} className="h-10 border-slate-200 font-medium focus:border-[#3b6dae]/50" />
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



            <TabsContent value="security" className="space-y-6 focus-visible:outline-none">
              <Card className="bg-white/50 border-[#3b6dae]/5 rounded-xl shadow-sm max-w-2xl">
                <CardHeader className="bg-[#3b6dae]/5 border-b border-[#3b6dae]/5 py-3">
                  <CardTitle className="text-[#3b6dae] text-lg font-black uppercase tracking-tighter">Credential Management</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Update your account password regularly to maintain security.</p>
                  <div className="space-y-2">
                    <PasswordInput label="Current Password" value={currentPassword} onChange={setCurrentPassword} />
                    <PasswordInput label="New Password" value={newPassword} onChange={setNewPassword} />
                    <PasswordInput label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} />
                  </div>
                  <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending} className="bg-[#3b6dae] hover:bg-[#2d5385] h-11 px-8 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-[#3b6dae]/20 transition-all">
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

            {hasRole("admin") && (
              <TabsContent value="system" className="space-y-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-white/50 border-[#3b6dae]/5 rounded-3xl overflow-hidden">
                    <CardHeader className="bg-[#3b6dae]/5 border-b border-[#3b6dae]/5 py-6">
                      <CardTitle className="text-[#3b6dae] text-sm font-black uppercase tracking-widest">Policy Engine</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                      <div className="flex justify-between items-center bg-white/40 p-3 rounded-xl border border-[#3b6dae]/5">
                        <Label className="text-[10px] font-black text-[#3b6dae]/60 uppercase tracking-widest">Global Annual Cycle</Label>
                        <Input defaultValue="18" className="w-16 h-8 text-center font-black bg-white border-[#3b6dae]/10 rounded-lg text-xs" />
                      </div>
                      <div className="flex justify-between items-center bg-white/40 p-3 rounded-xl border border-[#3b6dae]/5">
                        <Label className="text-[10px] font-black text-[#3b6dae]/60 uppercase tracking-widest">Sick Leave Quota</Label>
                        <Input defaultValue="12" className="w-16 h-8 text-center font-black bg-white border-[#3b6dae]/10 rounded-lg text-xs" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full h-10 border-[#3b6dae]/10 text-[#3b6dae] font-black uppercase text-[9px] tracking-[0.2em] rounded-xl transition-all">Push Policy Update</Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/50 border-[#3b6dae]/5 rounded-3xl overflow-hidden">
                    <CardHeader className="bg-[#3b6dae]/5 border-b border-[#3b6dae]/5 py-6">
                      <CardTitle className="text-[#3b6dae] text-sm font-black uppercase tracking-widest">Environment Info</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between border-b border-[#3b6dae]/5 pb-3">
                        <span className="text-[10px] font-black text-[#3b6dae]/40 uppercase tracking-widest">Kernel Version</span>
                        <span className="font-black text-[#3b6dae] text-xs">v2.1.w-ULTRA</span>
                      </div>
                      <div className="flex justify-between border-b border-[#3b6dae]/5 pb-3">
                        <span className="text-[10px] font-black text-[#3b6dae]/40 uppercase tracking-widest">Production State</span>
                        <Badge variant="outline" className="text-[9px] font-black bg-[#3b6dae]/10 text-[#3b6dae] border-none px-2 rounded-lg">OPERATIONAL</Badge>
                      </div>
                      <Button variant="ghost" className="w-full justify-start text-[10px] font-black text-[#c79d2d] hover:bg-blue-500/5 uppercase tracking-widest px-0">Diagnostic Stream View <ArrowRight size={10} className="ml-2" /></Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
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
  const utils = trpc.useUtils();

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
        <div className="flex items-center gap-2">
          <Input 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="h-9 bg-white border-[#3b6dae]/10 text-[10px] file:bg-[#3b6dae] file:text-white file:border-none file:px-2 file:h-full file:mr-2"
          />
          <Button 
            onClick={handleUpload} 
            disabled={uploadMutation.isPending}
            className="bg-[#3b6dae] hover:bg-[#2d5385] h-9 px-4 rounded-lg font-black uppercase text-[9px]"
          >
            {uploadMutation.isPending ? <Loader2 className="animate-spin h-3 w-3" /> : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserDocumentsTable() {
  const { user } = useAuth();
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const { data: documents, isLoading } = (trpc as any).hr.listDocuments.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

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
          <div key={doc.id} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-[#3b6dae]/5 hover:bg-white/60 transition-all">
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-4">
              <div className="text-right">
                {doc.status === 'verified' ? (
                  <Badge className="bg-green-500 font-black text-[8px] rounded-lg border-none hover:bg-green-600">VERIFIED</Badge>
                ) : doc.status === 'rejected' ? (
                  <Badge className="bg-red-500 font-black text-[8px] rounded-lg border-none hover:bg-red-600">REJECTED</Badge>
                ) : (
                  <Badge className="bg-amber-500 font-black text-[8px] rounded-lg border-none hover:bg-amber-600">PENDING</Badge>
                )}
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-[#3b6dae] hover:bg-[#3b6dae]/10 rounded-lg"
                onClick={() => setSelectedDocUrl(doc.fileUrl)}
                title="View PDF"
              >
                <Eye size={16} />
                <span className="sr-only">View</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
      {selectedDocUrl && (
        <Dialog open={!!selectedDocUrl} onOpenChange={() => setSelectedDocUrl(null)}>
          <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 border-none rounded-2xl overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Document Viewer</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedDocUrl(null)}
                  className="h-8 w-8 text-slate-500 hover:text-slate-800"
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950">
                <iframe 
                  src={selectedDocUrl} 
                  className="w-full h-full border-none"
                  title="PDF Viewer"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function AllEmployeesDocumentsTable() {
  const { hasRole } = useAuth();
  const [searchUser, setSearchUser] = useState("");
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  
  const { data: documents, isLoading } = (trpc as any).hr.listAllDocuments.useQuery(
    { status: "", category: "" },
    { enabled: hasRole("admin") || hasRole("hr") || hasRole("head_of_department") || hasRole("ceo_md") }
  );

  if (!hasRole("admin") && !hasRole("hr") && !hasRole("head_of_department") && !hasRole("ceo_md")) {
    return null;
  }

  if (isLoading) return <Loader2 className="animate-spin h-8 w-8 mx-auto text-[#3b6dae]" />;

  const filteredDocuments = documents?.filter((doc: any) => 
    !searchUser || doc.user?.name.toLowerCase().includes(searchUser.toLowerCase())
  ) || [];

  if (!filteredDocuments || filteredDocuments.length === 0) {
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
        <Input 
          placeholder="Search by employee name..." 
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          className="h-9 bg-white border-[#3b6dae]/10 text-xs"
        />
        <div className="space-y-2">
          {filteredDocuments.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-[#3b6dae]/5 hover:bg-white/60 transition-all">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-8 w-8 bg-[#3b6dae]/10 rounded-lg flex items-center justify-center text-[#3b6dae] shrink-0">
                  <FileText size={16} />
                </div>
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
                    {doc.user?.department && (
                      <>
                        <span className="text-[8px] text-slate-300">•</span>
                        <span className="text-[9px] font-bold text-slate-400">{doc.user.department.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <div className="text-right">
                  {doc.status === 'verified' ? (
                    <Badge className="bg-green-500 font-black text-[8px] rounded-lg border-none hover:bg-green-600">VERIFIED</Badge>
                  ) : doc.status === 'rejected' ? (
                    <Badge className="bg-red-500 font-black text-[8px] rounded-lg border-none hover:bg-red-600">REJECTED</Badge>
                  ) : (
                    <Badge className="bg-amber-500 font-black text-[8px] rounded-lg border-none hover:bg-amber-600">PENDING</Badge>
                  )}
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-[#3b6dae] hover:bg-[#3b6dae]/10 rounded-lg shrink-0"
                  onClick={() => setSelectedDocUrl(doc.fileUrl)}
                  title="View PDF"
                >
                  <Eye size={16} />
                  <span className="sr-only">View</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selectedDocUrl && (
        <Dialog open={!!selectedDocUrl} onOpenChange={() => setSelectedDocUrl(null)}>
          <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 border-none rounded-2xl overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Document Viewer</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedDocUrl(null)}
                  className="h-8 w-8 text-slate-500 hover:text-slate-800"
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950">
                <iframe 
                  src={selectedDocUrl} 
                  className="w-full h-full border-none"
                  title="PDF Viewer"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function UserDocumentsPdfConverter() {
  const { user } = useAuth();
  const { data: documents = [] } = (trpc as any).hr.listDocuments.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  return <PdfConverterCard documents={documents} />;
}

function AllEmployeesPdfConverter() {
  const { hasRole } = useAuth();
  const { data: documents = [] } = (trpc as any).hr.listAllDocuments.useQuery(
    { status: "", category: "" },
    { enabled: hasRole("admin") || hasRole("hr") || hasRole("head_of_department") || hasRole("ceo_md") }
  );

  return <PdfConverterCard documents={documents} />;
}
