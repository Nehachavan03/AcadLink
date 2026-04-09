import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, User, Shield, Users } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

const ROLES = [
  { value: "STUDENT", label: "Student", icon: GraduationCap, description: "Access your courses, attendance & assignments" },
  { value: "FACULTY", label: "Faculty", icon: User, description: "Manage classes, assignments & student records" },
  { value: "PARENT", label: "Parent", icon: Users, description: "Monitor your child's academic progress" },
  { value: "ADMIN", label: "Admin", icon: Shield, description: "Full system administration access" },
] as const;



const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<string>("STUDENT");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [linkedStudentEmail, setLinkedStudentEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.loginJson(email, password, selectedRole);
      login(res.access_token);
      toast({ title: "Login successful", description: "Welcome back!" });
      navigate("/dashboard");

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials";
      toast({
        title: "Login failed",
        description: message === "Failed to fetch"
          ? "Cannot reach the backend server. Please ensure your API is running and VITE_API_URL is configured."
          : message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register({ 
        email, 
        full_name: fullName, 
        password, 
        role: selectedRole,
        linked_student_email: selectedRole === "parent" ? linkedStudentEmail : undefined
      });
      toast({ title: "Registration successful", description: "You can now log in." });

      setMode("login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Registration failed",
        description: message === "Failed to fetch"
          ? "Cannot reach the backend server. Please ensure your API is running and VITE_API_URL is configured."
          : message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <GraduationCap className="h-10 w-10 text-accent" />
            <h1 className="text-3xl font-bold text-primary-foreground">AcadLink</h1>
          </div>
          <p className="text-muted-foreground text-sm">Student Academic Management System</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <CardTitle className="text-xl">Welcome back</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>

                {/* Role Selection */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-[10px] ${
                        selectedRole === role.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/30 text-muted-foreground"
                      }`}
                    >
                      <role.icon className="h-4 w-4" />
                      <span className="font-medium">{role.label}</span>
                    </button>
                  ))}
                </div>


                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@despu.edu.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-4">
                <CardTitle className="text-xl">Create account</CardTitle>
                <CardDescription>Register with your institution email</CardDescription>

                {/* Role Selection */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {ROLES.filter(r => r.value !== "ADMIN").map((role) => (

                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-[10px] ${
                        selectedRole === role.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/30 text-muted-foreground"
                      }`}
                    >
                      <role.icon className="h-4 w-4" />
                      <span className="font-medium">{role.label}</span>
                    </button>
                  ))}
                </div>


                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input
                      id="reg-name"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Institution Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@despu.edu.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {selectedRole === "parent" && (
                    <div className="space-y-2">
                      <Label htmlFor="reg-child-email text-primary font-bold">Child's Student Email</Label>
                      <Input
                        id="reg-child-email"
                        type="email"
                        placeholder="child.code@despu.edu.in"
                        value={linkedStudentEmail}
                        onChange={(e) => setLinkedStudentEmail(e.target.value)}
                        required
                        className="border-primary"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to the institution's terms and policies.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
