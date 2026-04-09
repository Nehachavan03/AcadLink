import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { User, Shield, Lock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">Manage your profile and system preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Email Address</Label>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <p className="text-sm font-medium capitalize">{user?.role}</p>
              </div>
              <div className="space-y-1">
                <Label>Account Type</Label>
                <div className="flex items-center gap-2 text-sm font-medium text-sidebar-primary">
                  <Shield className="h-4 w-4" />
                  Privileged Administrator
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Active Sessions
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                System Notifications
              </CardTitle>
              <CardDescription>Configure how you receive alerts about system activities.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h4 className="text-sm font-medium">New User Registrations</h4>
                    <p className="text-xs text-muted-foreground">Notify me when a new student or faculty registers.</p>
                  </div>
                  <Button variant="ghost" size="sm">Enabled</Button>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h4 className="text-sm font-medium">Security Alerts</h4>
                    <p className="text-xs text-muted-foreground">Critical alerts regarding failed logins or system errors.</p>
                  </div>
                  <Button variant="ghost" size="sm">Enabled</Button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-medium">System Maintenance</h4>
                    <p className="text-xs text-muted-foreground">Updates about planned downtime and maintenance windows.</p>
                  </div>
                  <Button variant="ghost" size="sm">Enabled</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettingsPage;
