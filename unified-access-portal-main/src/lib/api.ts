const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

  return res.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; full_name: string; password: string; role: string }) =>
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

  loginJson: (email: string, password: string) =>
    apiFetch<{ access_token: string; token_type: string }>("/auth/login/json", {
      method: "POST",
      body: { email, password },
    }),
};

// Dashboard
export const dashboardApi = {
  getStudentDashboard: (token: string) =>
    apiFetch("/dashboard/student", { token }),
};

// Attendance
export const attendanceApi = {
  mark: (data: { student_email: string; subject: string; status: string; date?: string }, token: string) =>
    apiFetch("/attendance/mark", { method: "POST", body: data, token }),
  getMyAttendance: (token: string) =>
    apiFetch("/attendance/my-attendance", { token }),
};

// Assignments
export const assignmentsApi = {
  create: (data: { title: string; description: string; deadline: string; subject: string }, token: string) =>
    apiFetch("/assignments/create", { method: "POST", body: data, token }),
  getAll: (token: string, subject?: string) =>
    apiFetch(`/assignments/all${subject ? `?subject=${subject}` : ""}`, { token }),
  getSubmissions: (assignmentId: string, token: string) =>
    apiFetch(`/assignments/submissions/${assignmentId}`, { token }),
  grade: (submissionId: string, data: { marks: number; feedback?: string }, token: string) =>
    apiFetch(`/assignments/grade/${submissionId}`, { method: "PATCH", body: data, token }),
  submit: (formData: FormData, token: string) =>
    apiFetch("/assignments/submit", { method: "POST", body: formData, token, isFormData: true }),
};

// Resources
export const resourcesApi = {
  create: (data: { title: string; subject: string; resource_link: string }, token: string) =>
    apiFetch("/resources/upload", { method: "POST", body: data, token }),
  getAll: (token: string) =>
    apiFetch("/resources/all", { token }),
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
};

// Achievements
export const achievementsApi = {
  award: (data: { student_email: string; title: string; description: string; category: string }, token: string) =>
    apiFetch("/achievements/award", { method: "POST", body: data, token }),
  getMine: (token: string) =>
    apiFetch("/achievements/my-achievements", { token }),
};

// Admin
export const adminApi = {
  getUsers: (token: string) =>
    apiFetch("/admin/users", { token }),
  updateRole: (data: { email: string; new_role: string }, token: string) =>
    apiFetch("/admin/update-role", { method: "PATCH", body: data, token }),
  deleteUser: (email: string, token: string) =>
    apiFetch(`/admin/delete-user/${email}`, { method: "DELETE", token }),
};
