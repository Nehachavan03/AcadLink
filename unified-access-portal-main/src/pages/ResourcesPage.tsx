import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resourcesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, ExternalLink, Trash2 } from "lucide-react";


const ResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "" });
  const [file, setFile] = useState<File | null>(null);

  const isAdmin = user?.role === "ADMIN";
  const isFacultyOrAdmin = user?.role === "FACULTY" || user?.role === "ADMIN";
  const canUpload = user?.role === "STUDENT" || user?.role === "FACULTY" || isAdmin;


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
    if (!file) {
      toast({ title: "Please select a file to upload", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("subject", form.subject);
      formData.append("file", file);

      await resourcesApi.create(formData, user.token);
      toast({ title: "Resource uploaded" });
      setShowCreate(false);
      setForm({ title: "", subject: "" });
      setFile(null);
      fetchResources();

    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === "PARENT") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <h2 className="text-2xl font-bold text-muted-foreground whitespace-pre-wrap text-center">
            You do not have permission to view this page.{"\n"}
            This area is for administrative purposes only.
          </h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Resources</h1>
          </div>
          {canUpload && (
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
                  <Label>File Attachment</Label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
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
                  <div className="flex gap-2">
                    <a href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}${r.resource_link}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1" /> View</Button>
                    </a>
                    <Button variant="secondary" size="sm" onClick={() => window.open(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}${r.resource_link}`, '_blank')}>
                      Download
                    </Button>

                    {isAdmin && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this resource?")) {
                            try {
                              await resourcesApi.delete(r._id || r.id, user?.token!);
                              toast({ title: "Resource deleted" });
                              fetchResources();
                            } catch (err: any) {
                              toast({ title: "Delete failed", description: err.message, variant: "destructive" });
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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

export default ResourcesPage;
