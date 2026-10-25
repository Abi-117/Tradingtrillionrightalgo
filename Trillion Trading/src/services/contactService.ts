import { post } from "./apiClient";
export const contactService = {
  send: (data: unknown) => post<{ message: string }>("/api/contact", data),
};
