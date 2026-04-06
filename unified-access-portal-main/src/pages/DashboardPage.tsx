import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ClipboardList, Trophy, BookOpen, Users, GraduationCap } from "lucide-react";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-primary-foreground/80 mt-1">
            {user?.email} · <span className="capitalize">{user?.role}</span>
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {user?.role === "student" && (
            <>
              <StatCard icon={Calendar} title="Attendance" value="—" description="View your records" color="text-info" />
              <StatCard icon={ClipboardList} title="Assignments" value="—" description="Pending tasks" color="text-warning" />
              <StatCard icon={Trophy} title="Achievements" value="—" description="Awards earned" color="text-accent" />
              <StatCard icon={BookOpen} title="Resources" value="—" description="Study materials" color="text-primary" />
            </>
          )}
          {user?.role === "faculty" && (
            <>
              <StatCard icon={Calendar} title="Attendance" value="—" description="Mark attendance" color="text-info" />
              <StatCard icon={ClipboardList} title="Assignments" value="—" description="Created" color="text-warning" />
              <StatCard icon={Trophy} title="Achievements" value="—" description="Awarded" color="text-accent" />
              <StatCard icon={BookOpen} title="Resources" value="—" description="Uploaded" color="text-primary" />
            </>
          )}
          {user?.role === "admin" && (
            <>
              <StatCard icon={Users} title="Users" value="—" description="Total registered" color="text-info" />
              <StatCard icon={GraduationCap} title="Students" value="—" description="Enrolled" color="text-accent" />
              <StatCard icon={Calendar} title="Attendance" value="—" description="Records" color="text-warning" />
              <StatCard icon={ClipboardList} title="Assignments" value="—" description="System-wide" color="text-primary" />
            </>
          )}
        </div>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Use the sidebar to navigate between different features. Connect to your backend API to see live data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">VITE_API_URL</code> environment variable to connect to your AcadLink backend.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const StatCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string;
  description: string;
  color: string;
}> = ({ icon: Icon, title, value, description, color }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <Icon className={`h-10 w-10 ${color} opacity-70`} />
      </div>
    </CardContent>
  </Card>
);

export default DashboardPage;
