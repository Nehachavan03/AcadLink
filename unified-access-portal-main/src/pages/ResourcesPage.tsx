import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resourcesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, ExternalLink } from "lucide-react";

const ResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", resource_link: "" });

  const isFacultyOrAdmin = user?.role === "faculty" || user?.role === "admin";

  useEffect(() => {
    if (user?.token) fetchResources();
  }, [user?.token]);

  const fetchResources = async () => {
    if (!user?.token) return;
    try {
      const data = await resourcesApi.getAll(user.token) as any[];
      setResources(data);
    } catch { /* no backend */ }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    setLoading(true);
    try {
      await resourcesApi.create(form, user.token);
      toast({ title: "Resource uploaded" });
      setShowCreate(false);
      setForm({ title: "", subject: "", resource_link: "" });
      fetchResources();
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
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Resources</h1>
          </div>
          {isFacultyOrAdmin && (
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-1" /> Add Resource
            </Button>
          )}
        </div>

        {showCreate && (
          <Card>
            <CardHeader><CardTitle>Upload Resource</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Link</Label>
                  <Input value={form.resource_link} onChange={(e) => setForm({ ...form, resource_link: e.target.value })} required />
                </div>
                <div><Button type="submit" disabled={loading}>{loading ? "Uploading..." : "Upload"}</Button></div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3">
          {resources.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No resources found.</CardContent></Card>
          ) : (
            resources.map((r: any) => (
              <Card key={r._id || r.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">{r.subject} · by {r.uploaded_by}</p>
                  </div>
                  <a href={r.resource_link} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1" /> Open</Button>
                  </a>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResourcesPage;
