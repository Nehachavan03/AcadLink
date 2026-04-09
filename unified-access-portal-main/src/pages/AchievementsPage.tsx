import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { achievementsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Plus, Award } from "lucide-react";

const AchievementsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ student_email: "", title: "", description: "", category: "" });
  const [loading, setLoading] = useState(false);

  const isFacultyOrAdmin = user?.role === "FACULTY" || user?.role === "ADMIN";


  useEffect(() => {
    if (user?.token && (user.role === "STUDENT" || user.role === "PARENT")) fetchAchievements();


  }, [user?.token, user?.role]);

  const fetchAchievements = async () => {
    if (!user?.token) return;
    try {
      const data = await achievementsApi.getMine(user.token) as any[];
      setAchievements(data);
    } catch { /* no backend */ }
  };

  const handleAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    setLoading(true);
    try {
      await achievementsApi.award(form, user.token);
      toast({ title: "Achievement awarded!" });
      setShowCreate(false);
      setForm({ student_email: "", title: "", description: "", category: "" });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold">Achievements</h1>
          </div>
          {isFacultyOrAdmin && (
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-1" /> Award Achievement
            </Button>
          )}
        </div>

        {showCreate && isFacultyOrAdmin && (
          <Card>
            <CardHeader><CardTitle>Award Achievement</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAward} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Student Email</Label>
                  <Input value={form.student_email} onChange={(e) => setForm({ ...form, student_email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input placeholder="Academic, Sports, Leadership" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div><Button type="submit" disabled={loading}>{loading ? "Awarding..." : "Award"}</Button></div>
              </form>
            </CardContent>
          </Card>
        )}

        {(user?.role === "STUDENT" || user?.role === "PARENT") && (


          <div className="grid gap-4">
            {achievements.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No achievements yet.</CardContent></Card>
            ) : (
              achievements.map((a: any) => (
                <Card key={a._id || a.id}>
                  <CardContent className="p-5 flex items-start gap-4">
                    <Award className="h-8 w-8 text-accent shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-sm text-muted-foreground">{a.category} · Awarded by {a.awarded_by}</p>
                      <p className="text-sm mt-1">{a.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AchievementsPage;
