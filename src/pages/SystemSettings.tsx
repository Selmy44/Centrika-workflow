import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Lock, Bell, Eye, Database, FileText, AlertCircle } from "lucide-react";
import { useState } from "react";

const settingsSections = [
  {
    title: "Leave Settings",
    icon: FileText,
    items: [
      { label: "Annual Leave Days", value: "18", editable: true },
      { label: "Sick Leave Days", value: "12", editable: true },
      { label: "Casual Leave Days", value: "4", editable: true },
      { label: "Minimum Employment Duration (days)", value: "365", editable: true },
    ]
  },
  {
    title: "Approval Settings",
    icon: Lock,
    items: [
      { label: "Approval Required For", value: "All Requests", editable: false },
      { label: "Auto-Approve Below Amount", value: "KES 10,000", editable: true },
      { label: "Escalation Levels", value: "2 levels", editable: false },
      { label: "Approval Timeout Days", value: "5 days", editable: true },
    ]
  },
  {
    title: "Notification Settings",
    icon: Bell,
    items: [
      { label: "Email Notifications", value: "Enabled", editable: false },
      { label: "SMS Alerts", value: "Enabled", editable: true },
      { label: "In-App Notifications", value: "Enabled", editable: false },
      { label: "Notification Frequency", value: "Real-time", editable: true },
    ]
  },
];

export default function SystemSettings() {
  const { isAuthenticated, user } = useAuth();
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSave = (key: string) => {
    setEditingItem(null);
    // Save logic would go here
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            System Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure system-wide settings and preferences for leave management and approvals
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <Card key={sectionIndex} className="bg-white dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {section.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {item.label}
                          </label>
                          {editingItem === `${sectionIndex}-${itemIndex}` ? (
                            <Input
                              type="text"
                              defaultValue={item.value}
                              className="h-8"
                              onChange={(e) => setValues({ ...values, [`${sectionIndex}-${itemIndex}`]: e.target.value })}
                            />
                          ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.value}
                            </p>
                          )}
                        </div>
                        {item.editable && (
                          <div className="ml-4">
                            {editingItem === `${sectionIndex}-${itemIndex}` ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(`${sectionIndex}-${itemIndex}`)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingItem(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingItem(`${sectionIndex}-${itemIndex}`)}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security Settings */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enhance account security</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Password Policy</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">12+ characters required</p>
                </div>
                <Button size="sm" variant="outline">
                  Update
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Session Timeout</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">30 minutes of inactivity</p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  System Version
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  v2.1.0
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Last Updated
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  June 15, 2024
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Database
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  PostgreSQL 15
                </p>
              </div>
              <Button className="w-full" size="sm" variant="outline">
                Check for Updates
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Integration Settings */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Connected external services and APIs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Email Service", provider: "Gmail SMTP", status: "Connected" },
                { name: "File Storage", provider: "DigitalOcean Spaces", status: "Connected" },
                { name: "Slack", provider: "Webhook Integration", status: "Disconnected" },
                { name: "Calendar Sync", provider: "Google Calendar", status: "Connected" },
              ].map((integration, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{integration.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{integration.provider}</p>
                  </div>
                  <Badge
                    className={
                      integration.status === "Connected"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }
                  >
                    {integration.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Backup & Maintenance */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle>Backup & Maintenance</CardTitle>
            <CardDescription>Data backup and system maintenance settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Last Backup</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">June 15, 2024 at 02:30 AM</p>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Successful
                </Badge>
              </div>
              <Button size="sm" variant="outline" className="w-full">
                Backup Now
              </Button>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Scheduled Maintenance</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Next: June 22, 2024 at 11:00 PM</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                The system will be temporarily unavailable during maintenance. Estimated duration: 30 minutes
              </p>
              <Button size="sm" variant="outline" className="w-full">
                View Maintenance Schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Important Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Admin Access Only:</strong> System settings affect all users. Changes should be made carefully and only by authorized administrators.
            </p>
            <p>
              <strong>Backup Reminder:</strong> Regular backups are performed automatically. Contact IT support to restore from a previous backup.
            </p>
            <p>
              <strong>Configuration Changes:</strong> Some changes may require system restart. Please plan accordingly.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
