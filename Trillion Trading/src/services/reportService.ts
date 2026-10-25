
import { api } from "./apiClient";
import type { Report } from "@/types/business";

const toReport = (report: any, category: string): Report => ({
  ...report,
  id: report.id ?? report._id,
  date: report.date ?? report.reportDate?.slice(0, 10) ?? "",
  category,
});

export const reportService = {
  list: async (): Promise<Report[]> => {
    const [trillionResult, rightAlgoResult] = await Promise.all([
      api<any>("/api/reports"),
      api<any>("/api/right-algo/reports"),
    ]);

    const trillionReports = (
      Array.isArray(trillionResult)
        ? trillionResult
        : trillionResult.reports ?? []
    ).map((report: any) => toReport(report, "Trillion Trading"));

    const rightAlgoReports = (
      Array.isArray(rightAlgoResult)
        ? rightAlgoResult
        : rightAlgoResult.reports ?? []
    ).map((report: any) => toReport(report, "Right Algo Trading"));

    return [...trillionReports, ...rightAlgoReports].sort(
      (a, b) => b.date.localeCompare(a.date),
    );
  },

  get: (id: string) =>
    api<Report>(`/api/reports/${encodeURIComponent(id)}`),
};
