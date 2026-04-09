import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  GraduationCap, LayoutDashboard, ClipboardList, BookOpen,
  Users, Trophy, MessageSquare, LogOut, Settings, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

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
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-sidebar text-sidebar-foreground sticky top-0 z-40">
        <Link to="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-sidebar-primary" />
          <span className="text-lg font-bold">AcadLink</span>
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r-sidebar-border">
            <SidebarContent user={user} logout={logout} navItems={navItems} location={location} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col shrink-0 border-r border-sidebar-border sticky top-0 h-screen">
        <SidebarContent user={user} logout={logout} navItems={navItems} location={location} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

const SidebarContent: React.FC<{
  user: any;
  logout: () => void;
  navItems: any[];
  location: any;
}> = ({ user, logout, navItems, location }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border hidden md:block">
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
    </div>
  );
};

function getNavItems(role: string) {
  const common = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/community", label: "Community", icon: MessageSquare },
  ];

  if (role === "STUDENT") {
    return [
      ...common,
      { href: "/attendance", label: "My Attendance", icon: Calendar },
      { href: "/assignments", label: "Assignments", icon: ClipboardList },
      { href: "/resources", label: "Resources", icon: BookOpen },
      { href: "/achievements", label: "Achievements", icon: Trophy },
    ];
  }
  if (role === "FACULTY") {
    return [
      ...common,
      { href: "/attendance", label: "Mark Attendance", icon: Calendar },
      { href: "/assignments", label: "Assignments", icon: ClipboardList },
      { href: "/resources", label: "Resources", icon: BookOpen },
      { href: "/achievements", label: "Award Achievement", icon: Trophy },
    ];
  }
  if (role === "PARENT") {
    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/achievements", label: "Achievements", icon: Trophy },
    ];
  }

  // ADMIN
  return [
    ...common,
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/subjects", label: "Manage Subjects", icon: BookOpen },
    { href: "/resources", label: "Resources", icon: ClipboardList },
    { href: "/achievements", label: "Achievements", icon: Trophy },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];
}


export default DashboardLayout;
