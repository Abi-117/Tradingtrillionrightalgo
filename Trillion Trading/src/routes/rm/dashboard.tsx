
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { rmApi } from "@/lib/rmApi";

export const Route = createFileRoute("/rm/dashboard")({
  component: RMDashboardPage,
});
const BACKEND_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

function getScreenshotUrl(url?: string) {
  if (!url) return "";

  // Already a complete URL
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Convert relative path to backend URL
  const path = url.startsWith("/") ? url : `/${url}`;

  return `${BACKEND_URL}${path}`;
}
type WeeklyReport = {
  _id?: string;
  week: number;
  brokerageReceived?: number;
  rmSharingAmount?: number;
  screenshotUrl?: string;
  notes?: string;
};

type Client = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  firstReferralDate?: string;
};

type Renewal = {
  _id: string;
  clientId: string | { name?: string };
  renewalDate: string;
  renewalAmount: number;
  notes?: string;
};

type DashboardData = {
  totals?: {
    clients?: number;
    newClients?: number;
    renewals?: number;
    brokerageReceived?: number;
    rmSharingAmount?: number;
  };
  clients?: Client[];
  newClients?: Client[];
  renewals?: Renewal[];
  weeklyReports?: WeeklyReport[];
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

function RMDashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const result = await rmApi<DashboardData>(
        `/api/rm/dashboard?month=${month}&year=${year}`
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [month, year]);

  const reports = data?.weeklyReports || [];
  const clients = data?.clients || [];
  const newClients = data?.newClients || [];
  const renewals = data?.renewals || [];

  const brokerage = reports.reduce(
    (sum, report) => sum + Number(report.brokerageReceived || 0),
    0
  );

  const sharing = reports.reduce(
    (sum, report) => sum + Number(report.rmSharingAmount || 0),
    0
  );

  const renewalTotal = renewals.reduce(
    (sum, renewal) => sum + Number(renewal.renewalAmount || 0),
    0
  );

  const totalClients = data?.totals?.clients ?? clients.length;
  const monthlyNewClients =
    data?.totals?.newClients ?? newClients.length;
  const monthlyRenewals = data?.totals?.renewals ?? renewals.length;
  const totalBrokerage =
    data?.totals?.brokerageReceived ?? brokerage;
  const totalSharing =
    data?.totals?.rmSharingAmount ?? sharing;

  const monthName = new Date(year, month - 1).toLocaleString(
    "en-IN",
    { month: "long" }
  );

  const cards = [
    { label: "Total Clients", value: String(totalClients) },
    { label: "New Clients", value: String(monthlyNewClients) },
    { label: "Renewals", value: String(monthlyRenewals) },
    { label: "Brokerage Received", value: money(totalBrokerage) },
    { label: "Renewal Amount", value: money(renewalTotal) },
    { label: "RM Sharing / Payable", value: money(totalSharing) },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">RM Dashboard</h1>
            <p className="mt-2 text-slate-400">
              Your monthly client and brokerage summary
            </p>
          </div>

          <button
            onClick={() => void loadDashboard()}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>

        <section className="mt-6 flex flex-wrap gap-3">
          <select
            aria-label="Select month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {new Date(2000, index).toLocaleString("en-IN", {
                  month: "long",
                })}
              </option>
            ))}
          </select>

          <select
            aria-label="Select year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
          >
            {Array.from({ length: 7 }, (_, index) => now.getFullYear() - 3 + index).map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              )
            )}
          </select>
        </section>

        {error && (
          <div role="alert" className="mt-5 rounded-lg bg-red-950 p-4 text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-slate-400">Loading dashboard...</p>
        ) : (
          <>
            <h2 className="mt-8 text-xl font-semibold">
              {monthName} {year} Summary
            </h2>

            <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="mt-3 break-words text-2xl font-bold">
                    {card.value}
                  </p>
                </div>
              ))}
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-xl font-semibold">Weekly Brokerage Reports</h2>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-slate-400">
                    <tr className="border-b border-slate-700">
                      <th className="px-3 py-3">Week</th>
                      <th className="px-3 py-3">Brokerage</th>
                      <th className="px-3 py-3">RM Sharing</th>
                      <th className="px-3 py-3">Screenshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((week) => {
                      const report = reports.find((item) => item.week === week);

                      return (
                        <tr key={week} className="border-b border-slate-800">
                          <td className="px-3 py-4">Week {week}</td>
                          <td className="px-3 py-4">
                            {money(Number(report?.brokerageReceived || 0))}
                          </td>
                          <td className="px-3 py-4">
                            {money(Number(report?.rmSharingAmount || 0))}
                          </td>
                          <td className="px-3 py-4">
                            {report?.screenshotUrl ? (
  <a
    href={getScreenshotUrl(report.screenshotUrl)}
    target="_blank"
    rel="noopener noreferrer"
    className="text-emerald-400 underline"
  >
    View
  </a>
) : (
  <span className="text-slate-500">Not uploaded</span>
)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-xl font-semibold">Recent Renewals</h2>

              {renewals.length === 0 ? (
                <p className="mt-4 text-slate-400">
                  No renewals recorded for this month.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-sm">
                    <thead className="text-slate-400">
                      <tr className="border-b border-slate-700">
                        <th className="px-3 py-3">Client</th>
                        <th className="px-3 py-3">Renewal Date</th>
                        <th className="px-3 py-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renewals.map((renewal) => (
                        <tr key={renewal._id} className="border-b border-slate-800">
                          <td className="px-3 py-3">
                            {typeof renewal.clientId === "string"
                              ? renewal.clientId
                              : renewal.clientId?.name || "Client"}
                          </td>
                          <td className="px-3 py-3">
                            {new Date(renewal.renewalDate).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-3 py-3">
                            {money(Number(renewal.renewalAmount || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="mt-6">
              <Link
                to="/rm/login"
                className="text-sm text-slate-400 underline"
              >
                Sign out
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
