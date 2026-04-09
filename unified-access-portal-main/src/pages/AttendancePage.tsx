import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { attendanceApi, dashboardApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle, XCircle, Users, LayoutDashboard, AlertCircle } from "lucide-react";



const YEARS = ["FY", "SY", "TY", "Final Year"];
const SECTIONS = ["A", "B", "C"];



const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);


  // Filter state for faculty
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  // Mark attendance state
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  const isStudent = user?.role === "STUDENT";
  const isFacultyOrAdmin = user?.role === "FACULTY" || user?.role === "ADMIN";




  useEffect(() => {
    if (user?.token && user?.role === "STUDENT") {
      fetchAttendance();
    }
  }, [user?.role, user?.token]);


  // Refetch students & subjects when filters change
  useEffect(() => {
    if (!isStudent && user?.token && selectedYear) {
      fetchSubjectsByYear(selectedYear);
      if (selectedSection) {
        fetchStudents();
      }
    } else if (!isStudent) {
      setStudents([]);
      setSubjects([]);
    }
  }, [selectedYear, selectedSection, user?.token, isStudent]);

  const fetchSubjectsByYear = async (year: string) => {
    if (!user?.token) return;
    try {
      const data = await attendanceApi.getSubjects(user.token, year);
      setSubjects(data);
      // Reset selected subject if the new list doesn't contain it
      if (data.length > 0) {
        setSubject(data[0].name);
      } else {
        setSubject("");
      }
    } catch { }
  };



  const fetchAttendance = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const history = await attendanceApi.getMyAttendance(user.token) as any[];
      setRecords(history);
      
      // Also fetch dashboard stats for comprehensive overview
      if (isStudent) {
        const stats = await dashboardApi.getStudentDashboard(user.token);
        setDashboardData(stats);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load attendance", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  const fetchStudents = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const data = await attendanceApi.getStudents(user.token, selectedYear, selectedSection) as any[];
      setStudents(data);
      // Initialize map: everyone present by default
      const initialMap: Record<string, boolean> = {};
      data.forEach(s => initialMap[s.email] = true);
      setAttendanceMap(initialMap);
    } catch { 
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };


  const handleBulkMark = async () => {
    if (!user?.token || !subject || !date) {
      toast({ title: "Please select subject and date", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        subject,
        date,
        records: students.map(s => ({
          student_email: s.email,
          status: attendanceMap[s.email] ? "present" : "absent"
        }))
      };
      await attendanceApi.bulkMark(payload, user.token);
      toast({ title: "Attendance updated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (email: string) => {
    setAttendanceMap(prev => ({ ...prev, [email]: !prev[email] }));
  };

  const toggleAll = (checked: boolean) => {
    const newMap: Record<string, boolean> = {};
    students.forEach(s => newMap[s.email] = checked);
    setAttendanceMap(newMap);
  };

  const getStudentStats = () => {
    const stats: Record<string, { present: number, total: number }> = {};
    subjects.forEach(s => stats[s.name] = { present: 0, total: 0 });
    
    records.forEach(r => {
      if (stats[r.subject]) {
        stats[r.subject].total++;
        if (r.status === "present") stats[r.subject].present++;
      }
    });

    const overall = {
      present: records.filter(r => r.status === "present").length,
      total: records.length
    };

    return { stats, overall };
  };



  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{isStudent ? "My Attendance" : "Mark Attendance"}</h1>
        </div>

        {!isStudent && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                      <SelectContent>
                        {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger><SelectValue placeholder="Select Sec" /></SelectTrigger>
                      <SelectContent>
                        {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <Button onClick={handleBulkMark} disabled={loading || !selectedYear || !selectedSection || students.length === 0} className="w-full">
                    {loading ? "Processing..." : "Submit"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Students List</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedYear && selectedSection ? `${selectedYear} - Section ${selectedSection}` : "Select year and section to see students"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium">Mark All Present</Label>
                  <Checkbox 
                    checked={Object.values(attendanceMap).every(v => v)}
                    onCheckedChange={(checked) => toggleAll(!!checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="py-3 px-4 text-left font-medium">Name</th>
                        <th className="py-3 px-4 text-left font-medium">Email</th>
                        <th className="py-3 px-4 text-center font-medium">Status (Present)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map(s => (
                        <tr key={s.email} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">{s.full_name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{s.email}</td>
                          <td className="py-3 px-4 text-center">
                            <Checkbox 
                              checked={attendanceMap[s.email]} 
                              onCheckedChange={() => toggleStudent(s.email)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {isStudent && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData?.attendance_overview.map((s: any) => (
                <Card key={s.subject} className={s.is_low_attendance ? "bg-destructive/5 border-destructive/20 relative group" : "relative group"}>
                  <CardContent className="p-4 py-6 text-center">
                    <p className="text-2xl font-bold">{s.percentage}%</p>
                    <p className="text-xs text-muted-foreground uppercase font-semibold truncate px-2" title={s.subject}>{s.subject}</p>
                    <p className="text-[10px] mt-1 text-muted-foreground">{s.attended_classes}/{s.total_classes} Classes</p>
                    
                    {s.message && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AlertCircle className={cn("h-3 w-3", s.is_low_attendance ? "text-destructive" : "text-muted-foreground")} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {(!dashboardData || dashboardData.attendance_overview.length === 0) && (
                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                  <p className="text-sm text-muted-foreground">No subjects found for your year. Please contact Admin.</p>
                </div>
              )}
            </div>



            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                ) : records.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No attendance records found yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground font-medium">
                          <th className="text-left py-3 px-3">Date</th>
                          <th className="text-left py-3 px-3">Subject</th>
                          <th className="text-left py-3 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((r: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="py-3 px-3 font-medium">{r.date}</td>
                            <td className="py-3 px-3">{r.subject}</td>
                            <td className="py-3 px-3">
                              <Badge variant={r.status === "present" ? "default" : "destructive"} className="gap-1 px-2">
                                {r.status === "present" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {r.status}
                              </Badge>
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
        )}

      </div>
    </DashboardLayout>
  );
};

export default AttendancePage;
