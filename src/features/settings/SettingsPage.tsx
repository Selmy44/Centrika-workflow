import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Mail, Shield, Calendar, Loader2, Upload, Building2,
  Users, FileText, Bell, Eye, Database, Lock, Settings as SettingsIcon,
  ShieldCheck, Clock, Key, ArrowRight
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
  const [profileImage, setProfileImage] = useState<string>(user?.profileImage || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editDepartmentId, setEditDepartmentId] = useState(user?.departmentId?.toString() || "");
  const [editPosition, setEditPosition] = useState(user?.position || "");
  const [editStaffId, setEditStaffId] = useState(user?.staffId || "");
  const [editDateOfEmployment, setEditDateOfEmployment] = useState(user?.dateOfEmployment || "");
  const [editManagerId, setEditManagerId] = useState(user?.managerId?.toString() || "");

  // --- Password State ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- Preferences State ---
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState("english");
  const [timezone, setTimezone] = useState("utc+2");

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
      });
      await utils.auth.me.invalidate();
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
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)]">
        {/* Main Settings Area - 8 Columns */}
        <div className="lg:col-span-8 p-4 lg:p-8 space-y-6">
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
              <TabsTrigger value="preferences" className="px-4 gap-2 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#3b6dae] data-[state=active]:text-white transition-all rounded-lg h-full">
                <SettingsIcon size={14} />
                Preferences
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

            <TabsContent value="profile" className="space-y-2 focus-visible:outline-none">
              <Card className="bg-white/50 border-[#3b6dae]/5 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <CardHeader className="bg-[#3b6dae]/3 border-b border-[#3b6dae]/5 py-2 px-4">
                  <CardTitle className="text-[#3b6dae] ftext-sm font-black uppercase tracking-widest">Personal Identification</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-[#3b6dae] rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity" />
                      <Avatar className="h-24 w-24 border-4 border-white shadow-2xl rounded-2xl">
                        <AvatarImage src={user.profileImage ?? undefined} className="object-cover" />
                        <AvatarFallback className="bg-[#3b6dae] text-white text-2xl font-black">
                          {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor="avatar-upload" className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-[#c79d2d] text-white rounded-xl cursor-pointer hover:bg-[#c79d2d]/90 transition-all shadow-xl z-20 hover:scale-110 border-2 border-white">
                        <Upload size={12} className="font-bold" />
                        <span className="sr-only">Upload profile picture</span>
                        <input id="avatar-upload" type="file" className="hidden" onChange={handleProfileImageUpload} aria-label="Upload profile picture" />
                      </label>
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-black text-lg text-[#3b6dae] tracking-tight">{user.name}</h3>
                      <p className="text-[10px] font-bold text-[#3b6dae]/40 uppercase tracking-[0.2em]">
                        {user.role} Member
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="h-7 px-3 border-[#3b6dae]/10 text-[#3b6dae] font-black uppercase text-[8px] tracking-[0.15em] hover:bg-[#3b6dae] hover:text-white rounded-lg transition-all" onClick={handleUpdateProfile} disabled={updateProfileMutation.isPending}>
                          Update Metadata
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-[#3b6dae]/5" />

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-[#3b6dae]/40 uppercase tracking-widest pl-0.5">Full Name</Label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 bg-white/60 border-[#3b6dae]/10 focus:border-[#3b6dae]/30 rounded-lg font-bold text-xs shadow-none transition-all focus:bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-[#3b6dae]/40 uppercase tracking-widest pl-0.5">Email Address</Label>
                        <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-9 bg-white/60 border-[#3b6dae]/10 focus:border-[#3b6dae]/30 rounded-lg font-bold text-xs shadow-none transition-all focus:bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-[#3b6dae]/40 uppercase tracking-widest pl-0.5">Designation</Label>
                        <Input value={editPosition} onChange={(e) => setEditPosition(e.target.value)} className="h-9 bg-white/60 border-[#3b6dae]/10 focus:border-[#3b6dae]/30 rounded-lg font-bold text-xs shadow-none transition-all focus:bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-[#3b6dae]/40 uppercase tracking-widest pl-0.5">Department</Label>
                        <Select onValueChange={setEditDepartmentId} value={editDepartmentId?.toString()}>
                          <SelectTrigger className="h-9 bg-white/60 border-[#3b6dae]/10 focus:ring-0 rounded-lg font-bold text-xs shadow-none">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-[#3b6dae]/10 shadow-2xl">
                            {departments?.map((d: any) => (
                              <SelectItem key={d.id} value={d.id.toString()} className="font-bold text-[11px] py-2 px-3 focus:bg-[#3b6dae] focus:text-white rounded-lg mx-1.5 my-0.5">{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleUpdateProfile} className="bg-[#3b6dae] hover:bg-[#2d5385] h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[#3b6dae]/10 transition-all active:scale-95">
                    Sync Profile Details
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6 focus-visible:outline-none">
              <Card className="bg-white/50 border-[#3b6dae]/5 rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-[#3b6dae]/5 border-b border-[#3b6dae]/5 py-6">
                  <CardTitle className="text-[#3b6dae] text-lg font-black uppercase tracking-tighter">Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-[#3b6dae]/5 transition-all hover:bg-white/60">
                    <div>
                      <p className="font-black text-[#3b6dae] text-sm">System Alerts via Email</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">Receive document approval updates</p>
                    </div>
                    <input type="checkbox" id="email-notifications" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="h-5 w-5 rounded-lg border-[#3b6dae]/20 text-[#3b6dae] focus:ring-[#3b6dae]" aria-label="System Alerts via Email" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-[#3b6dae]/5 transition-all hover:bg-white/60">
                    <div>
                      <p className="font-black text-[#3b6dae] text-sm">In-App Live Stream</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">Real-time alerts in center stage</p>
                    </div>
                    <input type="checkbox" id="push-notifications" checked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} className="h-5 w-5 rounded-lg border-[#3b6dae]/20 text-[#3b6dae] focus:ring-[#3b6dae]" aria-label="In-App Live Stream" />
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

        {/* Side Panel Strip - 4 Columns */}
        <div className="lg:col-span-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-l border-[#3b6dae]/5 p-4 lg:p-10 space-y-10 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.5)]">
          <div className="space-y-6">
            <h2 className="text-[10px] font-black text-[#3b6dae]/40 uppercase tracking-[0.3em] px-1">Account Analysis</h2>

            <Card className="bg-[#3b6dae] text-white border-none rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
              <CardContent className="p-8 space-y-6 relative">
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="h-10 w-10 bg-[#c79d2d] rounded-xl flex items-center justify-center font-black text-white">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1.5">Portal Authority</p>
                    <p className="text-lg font-black tracking-tight">{user.role?.replace(/_/g, ' ').toUpperCase()}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-white/50 transition-colors">Integrity State</span>
                    <Badge className="bg-[#c79d2d] text-white border-none font-black text-[9px] px-3 py-1 rounded-lg shadow-lg">ACTIVE SYSTEM</Badge>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-white/50 transition-colors">Creation Stamp</span>
                    <span className="text-xs font-black tracking-tight">{new Date(user.createdAt || "").toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-white/50 transition-colors">Last Sync</span>
                    <span className="text-xs font-black tracking-tight">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <h2 className="text-[10px] font-black text-[#3b6dae]/40 uppercase tracking-[0.3em] px-1">Regional Parameters</h2>
            <Card className="bg-white/40 border-[#3b6dae]/5 rounded-3xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-[#3b6dae]/30 uppercase tracking-widest pl-1">Primary Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="h-11 bg-white border-[#3b6dae]/10 rounded-xl font-bold text-sm shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-[#3b6dae]/10 shadow-2xl">
                        <SelectItem value="english" className="font-bold py-3 px-4 focus:bg-[#3b6dae] focus:text-white rounded-xl mx-2 my-1">English (RWA)</SelectItem>
                        <SelectItem value="french" className="font-bold py-3 px-4 focus:bg-[#3b6dae] focus:text-white rounded-xl mx-2 my-1">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-[#3b6dae]/30 uppercase tracking-widest pl-1">Portal Zone Offset</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="h-11 bg-white border-[#3b6dae]/10 rounded-xl font-bold text-sm shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-[#3b6dae]/10 shadow-2xl">
                        <SelectItem value="utc+2" className="font-bold py-3 px-4 focus:bg-[#3b6dae] focus:text-white rounded-xl mx-2 my-1">Central Africa (UTC+2)</SelectItem>
                        <SelectItem value="utc" className="font-bold py-3 px-4 focus:bg-[#3b6dae] focus:text-white rounded-xl mx-2 my-1">Universal (UTC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full bg-[#3b6dae]/5 text-[#3b6dae] hover:bg-[#3b6dae] hover:text-white h-11 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all">Push Regional Updates</Button>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4 px-1">
            <div className="flex items-center gap-3 p-4 bg-[#c79d2d]/10 rounded-2xl border border-[#c79d2d]/20">
              <ShieldCheck className="text-[#3b6dae] shrink-0" size={20} />
              <p className="text-[10px] font-black text-[#3b6dae] uppercase tracking-wide leading-relaxed">System protected by Centrika Enterprise Security v4.2</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function DocumentUploadForm() {
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

    // In a real app, we would upload to S3 first. For now, we'll simulate it with a dummy URL.
    // In this codebase, we seem to use base64 for images or direct URLs.
    // I'll simulate the file metadata.
    uploadMutation.mutate({
      name,
      category,
      fileUrl: "https://example.com/mock-doc.pdf", // Mock URL
      fileType: file.type,
      fileSize: file.size,
    });
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
  const { data: documents, isLoading } = (trpc as any).hr.listDocuments.useQuery({});

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
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" aria-label="View document">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-[#3b6dae] hover:bg-[#3b6dae]/10 rounded-lg">
                <Eye size={16} />
                <span className="sr-only">View</span>
              </Button>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
