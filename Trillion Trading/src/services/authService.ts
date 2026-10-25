import { api, post } from "./apiClient";
import type { Member, Membership } from "@/types/business";
export const authService = {
  register: (data: unknown) => post<{ registrationId: string }>("/api/right-algo/register", data),
  login: (data: unknown) => post<{ authenticated: boolean }>("/api/right-algo/login", data),
  logout: () => post<void>("/api/right-algo/logout", {}),
  forgotPassword: (identity: string) =>
    post<{ message: string }>("/api/right-algo/forgot-password", { identity }),
  me: () => api<Member>("/api/right-algo/me"),
  membership: () => api<Membership>("/api/right-algo/membership"),
};
