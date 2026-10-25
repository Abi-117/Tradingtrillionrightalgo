import { api, post } from "./apiClient";
export const softwareService = {
  get: () => api<unknown>("/api/software"),
  requestTrial: (data: unknown) => post<{ message: string }>("/api/trial-requests", data),
};
