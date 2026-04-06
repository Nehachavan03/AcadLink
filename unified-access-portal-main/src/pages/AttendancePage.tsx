import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { attendanceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, XCircle } from "lucide-react";

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Mark attendance form (faculty/admin)
  const [studentEmail, setStudentEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("present");
  const [date, setDate] = useState("");

  const isStudent = user?.role === "student";

  useEffect(() => {
    if (isStudent && user?.token) {
      fetchAttendance();
    }
  }, [isStudent, user?.token]);

  const fetchAttendance = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const data = await attendanceApi.getMyAttendance(user.token) as any[];
      setRecords(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load attendance", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    setLoading(true);
    try {
      await attendanceApi.mark({ student_email: studentEmail, subject, status, date: date || undefined }, user.token);
      toast({ title: "Success", description: "Attendance marked" });
      setStudentEmail("");
      setSubject("");
      setDate("");
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{isStudent ? "My Attendance" : "Mark Attendance"}</h1>
        </div>

        {!isStudent && (
          <Card>
            <CardHeader>
              <CardTitle>Mark Student Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMark} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Student Email</Label>
                  <Input placeholder="student@despu.edu.in" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="Mathematics" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date (optional)</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={loading}>{loading ? "Marking..." : "Mark Attendance"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isStudent && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : records.length === 0 ? (
                <p className="text-muted-foreground text-sm">No attendance records found. Connect to the backend to view data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Subject</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r: any, i: number) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 px-3">{r.date}</td>
                          <td className="py-2 px-3">{r.subject}</td>
                          <td className="py-2 px-3">
                            <Badge variant={r.status === "present" ? "default" : "destructive"} className="gap-1">
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendancePage;
