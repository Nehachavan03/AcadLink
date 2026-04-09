import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { communityApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Send, Trash2 } from "lucide-react";


const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tags: "" });
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.token) fetchPosts();
  }, [user?.token]);

  const fetchPosts = async () => {
    if (!user?.token) return;
    try {
      const data = await communityApi.getPosts(user.token) as any[];
      setPosts(data);
    } catch { /* no backend */ }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    setLoading(true);
    try {
      await communityApi.createPost({
        title: form.title,
        content: form.content,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      }, user.token);
      toast({ title: "Post created" });
      setShowCreate(false);
      setForm({ title: "", content: "", tags: "" });
      fetchPosts();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (postId: string) => {
    if (!user?.token || !replyContent[postId]) return;
    try {
      await communityApi.reply({ post_id: postId, content: replyContent[postId] }, user.token);
      toast({ title: "Reply posted" });
      setReplyContent({ ...replyContent, [postId]: "" });
      fetchPosts();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user?.token || !confirm("Are you sure you want to delete this post?")) return;
    try {
      await communityApi.deletePost(postId, user.token);
      toast({ title: "Post deleted successfully" });
      fetchPosts();
    } catch (err: unknown) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Community Forum</h1>
          </div>
          {(user?.role === "FACULTY" || user?.role === "ADMIN" || user?.role === "STUDENT") && (
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-1" /> New Post
            </Button>
          )}
        </div>

        {showCreate && (
          <Card>
            <CardHeader><CardTitle>Create Post</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="help, math, exam" />
                </div>
                <Button type="submit" disabled={loading}>{loading ? "Posting..." : "Post"}</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No posts yet. Start a discussion!</CardContent></Card>
          ) : (
            posts.map((p: any) => (
              <Card key={p._id || p.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{p.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">by {p.author_name} · {p.created_at}</p>
                    </div>
                    {user?.role === "ADMIN" && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePost(p._id || p.id)} className="text-destructive h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm mt-3">{p.content}</p>
                  {p.tags?.length > 0 && (
                    <div className="flex gap-1 mt-3">
                      {p.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                    </div>
                  )}
                  {/* Replies */}
                  {p.replies?.length > 0 && (
                    <div className="mt-4 space-y-2 border-t pt-3">
                      {p.replies.map((r: any) => (
                        <div key={r._id || r.id} className="bg-muted rounded-lg p-3 text-sm">
                          <span className="font-medium">{r.author_name}</span>: {r.content}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Reply input */}
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Write a reply..."
                      value={replyContent[p._id || p.id] || ""}
                      onChange={(e) => setReplyContent({ ...replyContent, [p._id || p.id]: e.target.value })}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleReply(p._id || p.id)}>
                      <Send className="h-4 w-4" />
                    </Button>
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

export default CommunityPage;
