import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Trash2, ArrowLeft, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const YEARS = ["FY", "SY", "TY", "Final Year"];


const AdminSubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [selectedYear, setSelectedYear] = useState("FY");
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (user?.token) fetchSubjects();
  }, [user?.token]);

  const fetchSubjects = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const data = await adminApi.getSubjects(user.token);
      setSubjects(data);
    } catch (err: any) {
      toast({ 
        title: "Error loading subjects", 
        description: err.message || "Please check your connection.", 
        variant: "destructive" 
      });
    }
    finally { setLoading(false); }
  };


  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token || !newSubject || !selectedYear) return;
    try {
      await adminApi.addSubject(newSubject, selectedYear, user.token);
      toast({ title: "Subject added" });
      setNewSubject("");
      fetchSubjects();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };


  const handleDelete = async (id: number) => {
    if (!user?.token) return;
    try {
      await adminApi.deleteSubject(id, user.token);
      toast({ title: "Subject deleted" });
      fetchSubjects();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/users">
            <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Manage Subjects</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Add New Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject Name</Label>
                  <Input 
                    placeholder="e.g., Cloud Computing" 
                    value={newSubject} 
                    onChange={(e) => setNewSubject(e.target.value)}
                    required 
                  />
                </div>

                <Button type="submit" className="w-full gap-2">
                  <Plus className="h-4 w-4" /> Add Subject
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Active Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subjects added yet. Add some to populate the faculty dropdown.</p>
              ) : (
                <div className="space-y-2">
                  {subjects.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-medium">{s.name}</span>
                        <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase">
                          <GraduationCap className="h-3 w-3" />
                          {s.year}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSubjectsPage;
