import { api } from "./apiClient";
export const courseService = { list: () => api<unknown[]>("/api/courses") };
