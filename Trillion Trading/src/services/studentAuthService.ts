
import { api, post } from "./apiClient";

export interface Student {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

interface StudentAuthResponse {
  success: boolean;
  message: string;
  student: Student;
}

export const studentAuthService = {
  register: (data: {
    name: string;
    email: string;
    mobile: string;
    password: string;
  }) => post<StudentAuthResponse>("/api/student/auth/register", data),

  login: (data: { email: string; password: string }) =>
    post<StudentAuthResponse>("/api/student/auth/login", data),

  me: () =>
    api<{ success: boolean; student: Student }>("/api/student/auth/me"),

  logout: () =>
    post<{ success: boolean; message: string }>("/api/student/auth/logout", {}),
};
