import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


import { Calendar, ClipboardList, Trophy, BookOpen, Users, GraduationCap, Bell, Plus, Trash2, Megaphone, Paperclip } from "lucide-react";

import { dashboardApi, attendanceApi, assignmentsApi, resourcesApi, adminApi, achievementsApi, noticesApi, API_BASE } from "@/lib/api";




const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState<any>({
    attendance: "0",
    assignments: "0",
    achievements: "0",
    resources: "0",
    users: "0",
    students: "0"
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [childInfo, setChildInfo] = useState<any>(null);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "", target_year: "", attachment_url: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [noticeLoading, setNoticeLoading] = useState(false);




  useEffect(() => {

    if (user?.token) {
      if (user.role === "STUDENT" || user.role === "PARENT") {
        const fetchMethod = user.role === "STUDENT" 
          ? dashboardApi.getStudentDashboard 
          : dashboardApi.getParentDashboard;

        fetchMethod(user.token).then((data: any) => {
          if (user.role === "PARENT") setChildInfo(data);


          const totalConducted = data.attendance_overview.reduce((acc: number, curr: any) => acc + curr.total_classes, 0);
          const totalAttended = data.attendance_overview.reduce((acc: number, curr: any) => acc + curr.attended_classes, 0);
          
          const globalAvg = totalConducted > 0
            ? ((totalAttended / totalConducted) * 100).toFixed(1) + "%"
            : "0%";

          setStats((prev: any) => ({
            ...prev,
            attendance: globalAvg,
            assignments: data.attendance_overview.length.toString(), 
            achievements: data.recent_activities.filter((a: any) => a.type === "achievement").length.toString(),
          }));
        }).catch(() => {});
      }
      
      noticesApi.getAll(user.token).then(setNotices).catch(() => {});

      
      // Fetch common stats based on role
      if (user.role === "ADMIN") {

        adminApi.getUsers(user.token).then((users: any) => {
          setStats((prev: any) => ({
            ...prev,
            users: users.length.toString(),
            students: users.filter((u: any) => u.role === "student").length.toString()
          }));
        }).catch(() => {});
      }

      assignmentsApi.getAll(user.token).then((list: any) => {
        setStats((prev: any) => ({ ...prev, assignments: list.length.toString() }));
      }).catch(() => {});

      resourcesApi.getAll(user.token).then((list: any) => {
        setStats((prev: any) => ({ ...prev, resources: list.length.toString() }));
      }).catch(() => {});

      achievementsApi.getLeaderboard(user.token).then(setLeaderboard).catch(() => {});
    }
  }, [user]);

  const fetchNotices = () => {

    if (user?.token) noticesApi.getAll(user.token).then(setNotices).catch(() => {});
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    setNoticeLoading(true);
    try {
      let finalAttachmentUrl = noticeForm.attachment_url || null;

      // 1. Handle file upload if present
      if (selectedFile) {
        const uploadResult = await noticesApi.upload(selectedFile, user.token);
        finalAttachmentUrl = uploadResult.url;
      }

      // 2. Create notice
      await noticesApi.create({
        ...noticeForm,
        target_year: noticeForm.target_year === "General" ? null : noticeForm.target_year,
        attachment_url: finalAttachmentUrl
      }, user.token);

      // 3. Reset form
      setNoticeForm({ title: "", content: "", target_year: "General", attachment_url: "" });
      setSelectedFile(null);
      setShowNoticeForm(false);
      fetchNotices();
      toast({ title: "Notice Published", description: "Your notice has been broadcasted successfully." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Upload Failed", description: "There was an error uploading your document or creating the notice.", variant: "destructive" });
    } finally {
      setNoticeLoading(false);
    }
  };


  const handleDeleteNotice = async (id: number) => {
    if (!user?.token) return;
    try {
      await noticesApi.delete(id, user.token);
      fetchNotices();
    } catch (err: any) {
      console.error(err);
    }
  };




  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-primary-foreground/80 mt-1">
              {user?.email} · <span className="capitalize">{user?.role}</span>
              {user?.role === "PARENT" && childInfo && (

                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                  Monitoring: {childInfo.full_name}
                </span>
              )}
            </p>
          </div>
          <GraduationCap className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 rotate-12" />
        </div>

        {/* Notice Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-bold">Campus Notice Board</h2>
              </div>
              {(user?.role === "ADMIN" || user?.role === "FACULTY") && (

                <Button 
                  size="sm" 
                  variant={showNoticeForm ? "ghost" : "outline"}
                  onClick={() => setShowNoticeForm(!showNoticeForm)}
                >
                  {showNoticeForm ? "Cancel" : <><Plus className="h-4 w-4 mr-1" /> New Notice</>}
                </Button>
              )}
            </div>

            {showNoticeForm && (
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="p-4">
                  <form onSubmit={handleCreateNotice} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Notice Title</label>
                        <Input 
                          placeholder="e.g. Exam Schedule Update"
                          value={noticeForm.title}
                          onChange={e => setNoticeForm({...noticeForm, title: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Target Audience</label>
                        <select 
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          value={noticeForm.target_year}
                          onChange={e => setNoticeForm({...noticeForm, target_year: e.target.value})}
                          required
                        >
                          <option value="">Select Audience</option>
                          <option value="General">General (Everyone)</option>
                          <option value="FY">FY students only</option>
                          <option value="SY">SY students only</option>
                          <option value="TY">TY students only</option>
                          <option value="Final Year">Final Year only</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Document Attachment (Optional PDF)</Label>
                        <Input 
                          type="file" 
                          accept=".pdf,application/pdf" 
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="cursor-pointer bg-white"
                        />
                        {selectedFile && (
                          <p className="text-xs text-primary font-medium animate-pulse">
                            Selected: {selectedFile.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">

                      <label className="text-xs font-semibold">Content</label>
                      <Textarea 
                        placeholder="Write your announcement here..."
                        value={noticeForm.content}
                        onChange={e => setNoticeForm({...noticeForm, content: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={noticeLoading} className="w-full">
                      {noticeLoading ? "Publishing..." : <><Megaphone className="h-4 w-4 mr-2" /> Publish Notice</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
            <div className="space-y-3">
              {notices.length === 0 ? (
                <Card className="bg-muted/30">
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    No active notices for your division.
                  </CardContent>
                </Card>
              ) : (
                notices.map((n: any) => (
                  <Card key={n.id} className="border-l-4 border-l-accent overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-primary">{n.title}</h3>
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">
                            {n.target_year || "General"}
                          </span>
                        </div>
                        {(user?.role === "ADMIN" || user?.role === "FACULTY") && (

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteNotice(n.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <p className="text-sm leading-relaxed">{n.content}</p>
                      {n.attachment_url && (
                        <div className="mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7 gap-2"
                            onClick={() => window.open(n.attachment_url.startsWith('http') ? n.attachment_url : `${API_BASE}${n.attachment_url}`, '_blank')}

                          >
                            <Paperclip className="h-3 w-3" /> View Attachment
                          </Button>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t flex justify-between items-center text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> Posted by {n.author_email}
                        </span>
                        <span>{n.created_at}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Stats Grid - Moved inside because of the 2/1 layout */}
            <div className="grid grid-cols-1 gap-4">
              {user?.role === "STUDENT" && (

                <>
                  <StatCard icon={Calendar} title="Attendance" value={stats.attendance} description="Real-time tracking" color="text-info" />
                  <StatCard icon={ClipboardList} title="Assignments" value={stats.assignments} description="Track deadlines" color="text-warning" />
                  <StatCard icon={Trophy} title="Achievements" value={stats.achievements} description="Total earned" color="text-accent" />
                </>
              )}
              {user?.role === "PARENT" && (

                <>
                  <StatCard icon={Calendar} title="Attendance" value={stats.attendance} description="Child's record" color="text-info" />
                  <StatCard icon={Trophy} title="Achievements" value={stats.achievements} description="Total earned" color="text-accent" />
                </>
              )}

              {user?.role === "FACULTY" && (

                <>
                  <StatCard icon={Calendar} title="Attendance" value={stats.attendance} description="Mark attendance" color="text-info" />
                  <StatCard icon={ClipboardList} title="Assignments" value={stats.assignments} description="Created" color="text-warning" />
                  <StatCard icon={Trophy} title="Achievements" value={stats.achievements} description="Awarded" color="text-accent" />
                </>
              )}
              {user?.role === "ADMIN" && (

                <>
                  <StatCard icon={Users} title="Users" value={stats.users} description="Total registered" color="text-info" />
                  <StatCard icon={GraduationCap} title="Students" value={stats.students} description="Enrolled" color="text-accent" />
                  <StatCard icon={Calendar} title="Attendance" value={stats.attendance} description="Records" color="text-warning" />
                </>
              )}
            </div>
          </div>
        </div>


        {/* Global Leaderboard Widget */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-bold">Global Leaderboard (Top 10)</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Earn XP by participating in the community and completing assignments!</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.length === 0 ? <p className="text-sm text-muted-foreground">No XP earned yet by anyone.</p> :
                  leaderboard.map((student: any, idx: number) => (
                    <div key={student.id} className="flex justify-between items-center p-3 border rounded-lg bg-background">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold w-6 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-accent">{student.xp} XP</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );

};


const StatCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string;
  description: string;
  color: string;
}> = ({ icon: Icon, title, value, description, color }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <Icon className={`h-10 w-10 ${color} opacity-70`} />
      </div>
    </CardContent>
  </Card>
);

export default DashboardPage;
