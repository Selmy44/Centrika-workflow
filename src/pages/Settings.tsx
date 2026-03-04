import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Bell, Eye, Database, FileText, AlertCircle, Loader2, Shield, Clock } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState("english");
  const [timezone, setTimezone] = useState("utc+2");
  const [dataRetention, setDataRetention] = useState("90");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const updateSettingsMutation = trpc.auth.updateSettings.useMutation();

  const handleSaveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        emailNotifications,
        pushNotifications,
        language,
        timezone,
        dataRetention: parseInt(dataRetention),
      });
      toast.success("Settings saved successfully!");
      setShowSaveDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
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
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your application preferences and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notification Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive email updates for request status changes, approvals, and reminders</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="email-notifications"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive in-app notifications for important updates</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="push-notifications"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>
                </div>

                <Separator />

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">Notification Preferences</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Leave request approvals</li>
                    <li>Request rejections and comments</li>
                    <li>Leave balance updates</li>
                    <li>System maintenance alerts</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Display & Localization
                </CardTitle>
                <CardDescription>Customize your display and language preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="language" className="font-semibold">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language" className="bg-input border-border">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="english" className="text-white">English</SelectItem>
                      <SelectItem value="french" className="text-white">French</SelectItem>
                      <SelectItem value="spanish" className="text-white">Spanish</SelectItem>
                      <SelectItem value="portuguese" className="text-white">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="timezone" className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Zone
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone" className="bg-input border-border">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="utc-5" className="text-white">UTC-5 (EST)</SelectItem>
                      <SelectItem value="utc" className="text-white">UTC</SelectItem>
                      <SelectItem value="utc+1" className="text-white">UTC+1 (CET)</SelectItem>
                      <SelectItem value="utc+2" className="text-white">UTC+2 (EAT)</SelectItem>
                      <SelectItem value="utc+3" className="text-white">UTC+3</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your current timezone: <span className="font-semibold">UTC+2</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data & Privacy
                </CardTitle>
                <CardDescription>Manage your data and privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="data-retention" className="font-semibold">Data Retention Period</Label>
                  <Select value={dataRetention} onValueChange={setDataRetention}>
                    <SelectTrigger id="data-retention" className="bg-input border-border">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="30" className="text-white">30 days</SelectItem>
                      <SelectItem value="60" className="text-white">60 days</SelectItem>
                      <SelectItem value="90" className="text-white">90 days (Recommended)</SelectItem>
                      <SelectItem value="180" className="text-white">180 days</SelectItem>
                      <SelectItem value="365" className="text-white">1 year</SelectItem>
                      <SelectItem value="0" className="text-white">Keep indefinitely</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Historical data will be automatically archived after this period
                  </p>
                </div>

                <Separator />

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="font-semibold text-sm text-blue-400">Data Protection</p>
                      <p className="text-sm text-blue-300">
                        Your personal and work data is encrypted and protected according to industry standards. We never share your data with third parties without explicit consent.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <FileText className="mr-2 h-4 w-4" />
                    Download My Data
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Request a copy of all your personal data in a downloadable format
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Active Sessions</p>
                    <p className="text-sm text-muted-foreground">Currently 1 active session</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    View Sessions
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Configure
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Login Activity</p>
                    <p className="text-sm text-muted-foreground">Monitor your recent login attempts</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    View Activity
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Settings Button */}
            <div className="flex gap-3">
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Save Settings</DialogTitle>
                    <DialogDescription>Are you sure you want to save these changes?</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">Summary of Changes:</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Email Notifications: {emailNotifications ? "Enabled" : "Disabled"}</li>
                        <li>• Push Notifications: {pushNotifications ? "Enabled" : "Disabled"}</li>
                        <li>• Language: {language.charAt(0).toUpperCase() + language.slice(1)}</li>
                        <li>• Timezone: {timezone}</li>
                        <li>• Data Retention: {dataRetention === "0" ? "Indefinite" : `${dataRetention} days`}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveSettings} 
                      disabled={updateSettingsMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm & Save
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline">Reset to Defaults</Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings Summary */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Settings Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Notifications</p>
                  <div className="flex gap-2">
                    <Badge className={emailNotifications ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                      {emailNotifications ? "Email" : "Email Off"}
                    </Badge>
                    <Badge className={pushNotifications ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                      {pushNotifications ? "Push" : "Push Off"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Localization</p>
                  <p className="text-sm font-medium capitalize">{language}</p>
                  <p className="text-xs text-muted-foreground">{timezone}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Data Retention</p>
                  <p className="text-sm font-medium">
                    {dataRetention === "0" ? "Indefinite" : `${dataRetention} days`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Information */}
            <Card className="bg-blue-500/10 border border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <AlertCircle className="h-5 w-5" />
                  Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-blue-300">
                <p>
                  Your settings are automatically synced across all your devices.
                </p>
                <p>
                  Changes take effect immediately and cannot be reversed without manual intervention.
                </p>
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm" disabled>
                  View Documentation
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" disabled>
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
