import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  GraduationCap, LayoutDashboard, ClipboardList, BookOpen,
  Users, Trophy, MessageSquare, LogOut, Settings, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = getNavItems(user?.role || "student");

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-sidebar-primary" />
            <span className="text-lg font-bold">AcadLink</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.email}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

function getNavItems(role: string) {
  const common = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/community", label: "Community", icon: MessageSquare },
  ];

  if (role === "student") {
    return [
      ...common,
      { href: "/attendance", label: "My Attendance", icon: Calendar },
      { href: "/assignments", label: "Assignments", icon: ClipboardList },
      { href: "/resources", label: "Resources", icon: BookOpen },
      { href: "/achievements", label: "Achievements", icon: Trophy },
    ];
  }
  if (role === "faculty") {
    return [
      ...common,
      { href: "/attendance", label: "Mark Attendance", icon: Calendar },
      { href: "/assignments", label: "Assignments", icon: ClipboardList },
      { href: "/resources", label: "Resources", icon: BookOpen },
      { href: "/achievements", label: "Award Achievement", icon: Trophy },
    ];
  }
  // admin
  return [
    ...common,
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/attendance", label: "Attendance", icon: Calendar },
    { href: "/assignments", label: "Assignments", icon: ClipboardList },
    { href: "/resources", label: "Resources", icon: BookOpen },
    { href: "/achievements", label: "Achievements", icon: Trophy },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];
}

export default DashboardLayout;
