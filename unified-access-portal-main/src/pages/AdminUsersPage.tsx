import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Users, Trash2, Shield, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const YEARS = ["FY", "SY", "TY", "Final Year"];
const SECTIONS = ["A", "B", "C"];
const CSE = ["CSE"]; // Year prefix or similar can be added if needed, but user asked for FY, SY, TY, CSE


const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (user?.token) fetchUsers();
  }, [user?.token]);

  const fetchUsers = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const data = await adminApi.getUsers(user.token) as any[];
      setUsers(data);
    } catch { /* no backend */ }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (email: string, newRole: string) => {
    if (!user?.token) return;
    try {
      await adminApi.updateRole({ email, new_role: newRole }, user.token);
      toast({ title: "Role updated" });
      fetchUsers();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async (email: string) => {
    if (!user?.token) return;
    if (!confirm(`Delete user ${email}?`)) return;
    try {
      await adminApi.deleteUser(email, user.token);
      toast({ title: "User deleted" });
      fetchUsers();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const handleDivisionChange = async (email: string, year: string, section: string) => {
    if (!user?.token) return;
    try {
      await adminApi.updateStudentDivision({ email, year, section }, user.token);
      toast({ title: "Division updated" });
      fetchUsers();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };


  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">User Management</h1>
          </div>
          <Link to="/admin/subjects">
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" /> Manage Subjects
            </Button>
          </Link>
        </div>


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> All Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground text-sm">No users found. Connect to the backend.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Year</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Section</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Actions</th>

                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u._id || u.email} className="border-b last:border-0">
                        <td className="py-2 px-3">{u.full_name}</td>
                        <td className="py-2 px-3 text-muted-foreground">{u.email}</td>
                        <td className="py-2 px-3">
                          <Select
                            value={u.role}
                            onValueChange={(val) => handleRoleChange(u.email, val)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="STUDENT">Student</SelectItem>
                              <SelectItem value="FACULTY">Faculty</SelectItem>
                              <SelectItem value="PARENT">Parent</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-3">
                          {u.role === "STUDENT" ? (

                            <Select
                              value={u.year || ""}
                              onValueChange={(val) => handleDivisionChange(u.email, val, u.section || "A")}
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent>
                                {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="py-2 px-3">
                          {u.role === "STUDENT" ? (

                            <Select
                              value={u.section || ""}
                              onValueChange={(val) => handleDivisionChange(u.email, u.year || "FY", val)}
                            >
                              <SelectTrigger className="w-20 h-8">
                                <SelectValue placeholder="Sec" />
                              </SelectTrigger>
                              <SelectContent>
                                {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="py-2 px-3">

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(u.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;
