export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";


interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  isFormData?: boolean;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, isFormData } = options;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }

  if (res.status === 204) {
    return null as any;
  }

  return res.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; full_name: string; password: string; role: string; linked_student_email?: string }) =>
    apiFetch("/auth/register", { method: "POST", body: data }),


  login: (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    return fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(err.detail || "Login failed");
      }
      return res.json() as Promise<{ access_token: string; token_type: string }>;
    });
  },

  loginJson: (email: string, password: string, role: string) =>
    apiFetch<{ access_token: string; token_type: string }>("/auth/login/json", {
      method: "POST",
      body: { email, password, role },
    }),
};

// Dashboard
export const dashboardApi = {
  getStudentDashboard: (token: string) =>
    apiFetch("/dashboard/student", { token }),
  getParentDashboard: (token: string) =>
    apiFetch("/dashboard/parent", { token }),
};


// Attendance
export const attendanceApi = {
  mark: (data: { student_email: string; subject: string; status: string; date?: string }, token: string) =>
    apiFetch("/attendance/mark", { method: "POST", body: data, token }),
  getMyAttendance: (token: string) =>
    apiFetch("/attendance/my-attendance", { token }),
  getStudents: (token: string, year?: string, section?: string) => {
    let url = "/attendance/students";
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (section) params.append("section", section);
    if (params.toString()) url += `?${params.toString()}`;
    return apiFetch<{ email: string; full_name: string; _id: string; role: string; year?: string; section?: string }[]>(url, { token });
  },
  bulkMark: (data: { subject: string; date: string; records: { student_email: string; status: string }[] }, token: string) =>
    apiFetch("/attendance/bulk-mark", { method: "POST", body: data, token }),
  getSubjects: (token: string, year?: string) => {
    let url = "/attendance/subjects";
    if (year) url += `?year=${encodeURIComponent(year)}`;
    return apiFetch<{ id: number; name: string; year: string }[]>(url, { token });
  },
};

// Assignments
export const assignmentsApi = {
  create: (data: { title: string; description: string; deadline: string; subject: string; year: string; section: string }, token: string) =>
    apiFetch("/assignments/create", { method: "POST", body: data, token }),
  getAll: (token: string, subject?: string, year?: string, section?: string) => {
    let url = "/assignments/all";
    const params = new URLSearchParams();
    if (subject) params.append("subject", subject);
    if (year) params.append("year", year);
    if (section) params.append("section", section);
    if (params.toString()) url += `?${params.toString()}`;
    return apiFetch<any[]>(url, { token });
  },

  getSubmissions: (assignmentId: string, token: string) =>
    apiFetch(`/assignments/submissions/${assignmentId}`, { token }),
  grade: (submissionId: string, data: { marks: number; feedback?: string }, token: string) =>
    apiFetch(`/assignments/grade/${submissionId}`, { method: "PATCH", body: data, token }),
  submit: (formData: FormData, token: string) =>
    apiFetch("/assignments/submit", { method: "POST", body: formData, token, isFormData: true }),
  getMySubmissions: (token: string) =>
    apiFetch("/assignments/my-submissions", { token }),
  unsubmit: (assignmentId: string, token: string) =>
    apiFetch(`/assignments/unsubmit/${assignmentId}`, { method: "DELETE", token }),
};

// Resources
export const resourcesApi = {
  create: (formData: FormData, token: string) =>
    apiFetch("/resources/upload", { method: "POST", body: formData, token, isFormData: true }),
  getAll: (token: string) =>
    apiFetch("/resources/all", { token }),
  delete: (resourceId: number, token: string) =>
    apiFetch(`/resources/delete/${resourceId}`, { method: "DELETE", token }),
};

// Community
export const communityApi = {
  createPost: (data: { title: string; content: string; tags: string[] }, token: string) =>
    apiFetch("/community/post", { method: "POST", body: data, token }),
  getPosts: (token: string) =>
    apiFetch("/community/posts", { token }),
  getPost: (postId: string, token: string) =>
    apiFetch(`/community/post/${postId}`, { token }),
  reply: (data: { post_id: string; content: string }, token: string) =>
    apiFetch("/community/reply", { method: "POST", body: data, token }),
  deletePost: (postId: string, token: string) =>
    apiFetch(`/community/post/${postId}`, { method: "DELETE", token }),
};

// Achievements
export const achievementsApi = {
  award: (data: { student_email: string; title: string; description: string; category: string }, token: string) =>
    apiFetch("/achievements/award", { method: "POST", body: data, token }),
  getMine: (token: string) =>
    apiFetch("/achievements/my-achievements", { token }),
  getLeaderboard: (token: string) =>
    apiFetch("/achievements/leaderboard", { token }),
};

// Notices
export const noticesApi = {
  create: (notice: { title: string; content: string; target_year?: string | null; attachment_url?: string | null }, token: string) =>
    apiFetch("/notices/create", { method: "POST", body: notice, token }),
  upload: async (file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<{ url: string }>("/notices/upload", {
      method: "POST",
      body: formData,
      token,
      isFormData: true
    });
  },

  getAll: (token: string) =>

    apiFetch<any[]>("/notices/all", { token }),
  delete: (id: number, token: string) =>
    apiFetch(`/notices/${id}`, { method: "DELETE", token }),
};


// Admin
export const adminApi = {
  getUsers: (token: string) => apiFetch<any[]>("/admin/users", { token }),
  updateRole: (data: { email: string; new_role: string }, token: string) =>
    apiFetch("/admin/update-role", { method: "PATCH", body: data, token }),
  deleteUser: (email: string, token: string) =>
    apiFetch(`/admin/delete-user/${email}`, { method: "DELETE", token }),
  updateStudentDivision: (data: { email: string; year: string; section: string }, token: string) =>
    apiFetch("/admin/update-student-division", { method: "PATCH", body: data, token }),
  getSubjects: (token: string) => apiFetch<any[]>("/admin/subjects", { token }),
  addSubject: (name: string, year: string, token: string) =>
    apiFetch("/admin/subjects", { method: "POST", body: { name, year }, token }),
  deleteSubject: (id: number, token: string) =>
    apiFetch(`/admin/subjects/${id}`, { method: "DELETE", token }),
};
