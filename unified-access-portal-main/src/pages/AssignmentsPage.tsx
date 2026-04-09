import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignmentsApi } from "@/lib/api";

import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Plus } from "lucide-react";

const YEARS = ["FY", "SY", "TY", "Final Year"];
const SECTIONS = ["A", "B", "C"];

const AssignmentsPage: React.FC = () => {

  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [form, setForm] = useState({ title: "", description: "", deadline: "", subject: "", year: "FY", section: "A" });


  const isFacultyOrAdmin = user?.role === "FACULTY" || user?.role === "ADMIN";


  useEffect(() => {
    if (user?.token) fetchAssignments();
  }, [user?.token, selectedYear, selectedSection]);


  const fetchAssignments = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      // Use filters for faculty
      let data: any[];
      if (isFacultyOrAdmin) {
        const yearFilter = (selectedYear && selectedYear !== "All Years") ? selectedYear : undefined;
        const sectionFilter = (selectedSection && selectedSection !== "All Sections") ? selectedSection : undefined;
        data = await assignmentsApi.getAll(user.token, undefined, yearFilter, sectionFilter) as any[];
      } else {

        data = await assignmentsApi.getAll(user.token) as any[];
      }
      setAssignments(data);
      if (user.role === "STUDENT") {
        fetchMySubmissions();
      }
    } catch {
      // silent - no backend
    } finally {
      setLoading(false);
    }
  };


  const fetchMySubmissions = async () => {
    if (!user?.token) return;
    try {
      const data = await assignmentsApi.getMySubmissions(user.token) as any[];
      setMySubmissions(data);
    } catch { }
  };


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    setLoading(true);
    try {
      await assignmentsApi.create(form, user.token);
      toast({ title: "Assignment created" });
      setShowCreate(false);
      setForm({ title: "", description: "", deadline: "", subject: "", year: "FY", section: "A" });
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
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={form.section} onValueChange={(v) => setForm({ ...form, section: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
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

        {isFacultyOrAdmin && (
          <div className="flex gap-4 p-4 border rounded-lg bg-muted/20">
            <div className="w-1/2 md:w-1/4 space-y-1">
              <Label className="text-xs">Filter Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Years" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Years">All Years</SelectItem>
                  {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2 md:w-1/4 space-y-1">
              <Label className="text-xs">Filter Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Sections" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Sections">All Sections</SelectItem>
                  {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" className="h-9 mt-auto text-xs" onClick={() => { setSelectedYear(""); setSelectedSection(""); }}>Reset</Button>
          </div>
        )}


        <div className="grid gap-4">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No assignments found.
              </CardContent>
            </Card>
          ) : (
            assignments.map((a: any) => (
              <AssignmentCard key={a._id || a.id} assignment={a} role={user?.role} token={user?.token} mySubmissions={mySubmissions} refreshMySubmissions={fetchMySubmissions} />
            ))

          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const AssignmentCard: React.FC<{ assignment: any; role: string | undefined; token: string | undefined; mySubmissions?: any[]; refreshMySubmissions?: () => void }> = ({ assignment: a, role, token, mySubmissions, refreshMySubmissions }) => {

  const [showSubmit, setShowSubmit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [gradeFormId, setGradeFormId] = useState<string | null>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("assignment_id", a._id || a.id);
      formData.append("submission_text", comment);
      if (file) formData.append("file", file);

      await assignmentsApi.submit(formData, token);
      toast({ title: "Assignment submitted successfully!" });
      setShowSubmit(false);
      refreshMySubmissions?.();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubmit = async () => {
    if (!token) return;
    if (!confirm("Are you sure you want to unsubmit this assignment?")) return;
    setLoading(true);
    try {
      await assignmentsApi.unsubmit(a._id || a.id, token);
      toast({ title: "Unsubmitted successfully" });
      refreshMySubmissions?.();
      setShowSubmit(false);
    } catch (err: any) {
      toast({ title: "Unsubmit failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {

    if (!token) return;
    try {
      const data = await assignmentsApi.getSubmissions(a._id || a.id, token) as any[];
      setSubmissions(data);
      setShowView(true);
    } catch (err: any) {
      toast({ title: "Failed to fetch submissions", description: err.message, variant: "destructive" });
    }
  };

  const handleGrade = async (submissionId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      await assignmentsApi.grade(submissionId, { marks: parseFloat(marks), feedback }, token);
      toast({ title: "Graded successfully" });
      setGradeFormId(null);
      fetchSubmissions(); // refresh the list
    } catch (err: any) {
      toast({ title: "Grading failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  const isLate = (submittedAt: string, deadline: string) => {
    return new Date(submittedAt) > new Date(deadline + "T23:59:59");
  };

  const mySubmission = mySubmissions?.find(s => s.assignment_id === (a._id || a.id));

  return (

    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{a.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{a.subject} · Due: {a.deadline}</p>
            <p className="text-sm mt-3 leading-relaxed">{a.description}</p>
            
            <div className="mt-4 flex gap-2">
              {role === "STUDENT" && !mySubmission && (
                <Button size="sm" onClick={() => setShowSubmit(!showSubmit)}>
                  {showSubmit ? "Cancel" : "Submit Work"}
                </Button>
              )}
              {role === "STUDENT" && mySubmission && (
                <div className="flex gap-3 items-center">
                  <Button size="sm" variant="destructive" onClick={handleUnsubmit} disabled={loading}>
                    Unsubmit
                  </Button>
                  <span className="text-sm font-medium text-green-600">Submitted</span>
                  {isLate(mySubmission.submitted_at, a.deadline) && <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">Late</span>}
                </div>
              )}
              {(role === "FACULTY" || role === "ADMIN") && (

                <Button size="sm" variant="outline" onClick={fetchSubmissions}>
                  View Submissions
                </Button>
              )}
            </div>

            {showSubmit && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Comments</Label>
                    <Textarea placeholder="Add a comment to your teacher..." value={comment} onChange={(e) => setComment(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Attach File</Label>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </div>
                  <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Turn In"}</Button>
                </form>
              </div>
            )}

            {showView && (
              <div className="mt-6 space-y-4">
                <h4 className="font-medium">Student Submissions</h4>
                <div className="grid gap-3">
                  {submissions.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : 
                    submissions.map((s: any) => (
                      <div key={s._id} className="p-3 border rounded bg-background flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">{s.student_email}</span>
                          <div>
                            <span className="text-muted-foreground mr-2">{s.submitted_at}</span>
                            {isLate(s.submitted_at, a.deadline) && <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">Late</span>}
                          </div>
                        </div>

                        {s.submission_text && <p className="text-sm italic">"{s.submission_text}"</p>}
                        {s.file_url && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="link" asChild className="p-0 h-auto">
                              <a href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}${s.file_url}`} target="_blank" rel="noreferrer">
                                Download Attachment
                              </a>
                            </Button>
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-2 pt-2 border-t">
                          <div>
                            {s.marks !== null ? <p className="text-sm font-semibold text-green-600">Graded: {s.marks} {s.feedback && `- ${s.feedback}`}</p> : <p className="text-sm text-yellow-600">Not Graded</p>}
                          </div>
                          {(role === "faculty" || role === "admin") && gradeFormId !== (s._id || s.id) && (
                            <Button size="sm" variant="outline" onClick={() => { setGradeFormId(s._id || s.id); setMarks(s.marks?.toString() || ""); setFeedback(s.feedback || ""); }}>Grade</Button>
                          )}
                        </div>
                        {gradeFormId === (s._id || s.id) && (
                          <div className="mt-2 p-3 border rounded bg-muted space-y-3">
                            <Input type="number" placeholder="Marks (e.g. 100)" value={marks} onChange={e => setMarks(e.target.value)} />
                            <Textarea placeholder="Feedback" value={feedback} onChange={e => setFeedback(e.target.value)} />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleGrade(s._id || s.id)} disabled={loading}>Save Grade</Button>
                              <Button size="sm" variant="ghost" onClick={() => setGradeFormId(null)} disabled={loading}>Cancel</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))

                  }
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowView(false)}>Close</Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentsPage;

