import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { assignmentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Plus } from "lucide-react";

const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", deadline: "", subject: "" });

  const isFacultyOrAdmin = user?.role === "faculty" || user?.role === "admin";

  useEffect(() => {
    if (user?.token) fetchAssignments();
  }, [user?.token]);

  const fetchAssignments = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const data = await assignmentsApi.getAll(user.token) as any[];
      setAssignments(data);
    } catch {
      // silent - no backend
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    setLoading(true);
    try {
      await assignmentsApi.create(form, user.token);
      toast({ title: "Assignment created" });
      setShowCreate(false);
      setForm({ title: "", description: "", deadline: "", subject: "" });
      fetchAssignments();
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
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Assignments</h1>
          </div>
          {isFacultyOrAdmin && (
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-1" /> Create
            </Button>
          )}
        </div>

        {showCreate && (
          <Card>
            <CardHeader><CardTitle>New Assignment</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div><Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Assignment"}</Button></div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No assignments found. Connect to the backend to view data.
              </CardContent>
            </Card>
          ) : (
            assignments.map((a: any) => (
              <Card key={a._id || a.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{a.subject} · Due: {a.deadline}</p>
                      <p className="text-sm mt-2">{a.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AssignmentsPage;
