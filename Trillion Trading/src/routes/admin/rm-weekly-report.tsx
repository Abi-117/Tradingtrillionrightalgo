
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { rmApi } from "@/lib/rmApi";

export const Route = createFileRoute("/admin/rm-weekly-report")({
  component: RMWeeklyReportPage,
});
const BACKEND_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

function getScreenshotUrl(url?: string) {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const path = url.startsWith("/") ? url : `/${url}`;

  return `${BACKEND_URL}${path}`;
}
type RM = {
  _id: string;
  name: string;
  email: string;
};

type SavedReport = {
  _id?: string;
  rmId: string | { _id?: string; name?: string };
  year: number;
  month: number;
  week: number;
  brokerageReceived: number;
  rmSharingAmount: number;
  screenshotUrl?: string;
  notes?: string;
};

function RMWeeklyReportPage() {
  const today = new Date();

  const [rms, setRms] = useState<RM[]>([]);
  const [rmId, setRmId] = useState("");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [week, setWeek] = useState(1);
  const [brokerageReceived, setBrokerageReceived] = useState("");
  const [rmSharingAmount, setRmSharingAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
const [selectedRM, setSelectedRM] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRMs() {
      try {
        const response = await rmApi<
          RM[] | { rms: RM[] }
        >("/api/admin/rm/rms");

        const list = Array.isArray(response)
          ? response
          : response.rms;

        setRms(list || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load RM accounts."
        );
      }
    }

    void loadRMs();
  }, []);

  async function loadSavedReports() {
  try {
    const response = await rmApi<{ reports?: SavedReport[] }>(
      "/api/admin/rm/weekly-reports"
    );

    setSavedReports(response.reports || []);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to load saved reports."
    );
  }
}

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!rmId) {
      setError("Please select an RM.");
      return;
    }

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100 ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(week) ||
      week < 1 ||
      week > 5
    ) {
      setError("Please select a valid year, month and week.");
      return;
    }

    const brokerage = Number(brokerageReceived);
    const sharing = Number(rmSharingAmount);

    if (
      brokerageReceived.trim() === "" ||
      rmSharingAmount.trim() === "" ||
      !Number.isFinite(brokerage) ||
      !Number.isFinite(sharing) ||
      brokerage < 0 ||
      sharing < 0
    ) {
      setError("Enter valid non-negative amounts.");
      return;
    }

    if (sharing > brokerage) {
      setError("RM sharing cannot exceed brokerage received.");
      return;
    }

    const formData = new FormData();
    formData.append("rmId", rmId);
    formData.append("year", String(year));
    formData.append("month", String(month));
    formData.append("week", String(week));
    formData.append("brokerageReceived", String(brokerage));
    formData.append("rmSharingAmount", String(sharing));
    formData.append("notes", notes);

    if (screenshot) {
      formData.append("screenshot", screenshot);
    }

    try {
      setLoading(true);

      await rmApi("/api/admin/rm/weekly-report", {
        method: "PUT",
        body: formData,
      });

      setMessage("Weekly brokerage report saved successfully!");
      await loadSavedReports();
      setScreenshot(null);

      const fileInput = document.getElementById(
        "brokerage-screenshot"
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save weekly report."
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
  void loadSavedReports();
}, []);

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/admin/rm-management"
          className="text-sm text-emerald-400 hover:underline"
        >
          ← Back to RM Management
        </Link>

        <h1 className="mt-6 text-3xl font-bold">
          Weekly Brokerage Update
        </h1>

        <p className="mt-2 text-slate-400">
          Update brokerage received and RM sharing amount.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <div>
            <label className="mb-2 block text-sm">
              Select RM
            </label>

            <select
              value={rmId}
              onChange={(e) => setRmId(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select RM Account</option>

              {rms.map((rm) => (
                <option key={rm._id} value={rm._id}>
                  {rm.name} - {rm.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm">
                Year
              </label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className={inputClass}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2026, i).toLocaleString("en", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm">
                Week
              </label>
              <select
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                className={inputClass}
              >
                {[1, 2, 3, 4, 5].map((w) => (
                  <option key={w} value={w}>
                    Week {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm">
              Brokerage Received (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={brokerageReceived}
              onChange={(e) =>
                setBrokerageReceived(e.target.value)
              }
              placeholder="Example: 15000"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">
              RM Sharing Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={rmSharingAmount}
              onChange={(e) =>
                setRmSharingAmount(e.target.value)
              }
              placeholder="Example: 5000"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">
              Brokerage Screenshot
            </label>
            <input
              id="brokerage-screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) =>
                setScreenshot(e.target.files?.[0] || null)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">
              Admin Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Optional notes..."
              className={inputClass}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="text-sm text-emerald-400">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-400 px-6 py-3 font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Weekly Report"}
          </button>
        </form>
        
<section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-xl font-semibold">Saved Weekly Brokerage Reports</h2>
    <button
      type="button"
      onClick={() => void loadSavedReports()}
      className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
    >
      Refresh Reports
    </button>
  </div>

  {savedReports.length === 0 ? (
    <p className="mt-5 text-slate-400">
      No saved reports found.
    </p>
  ) : (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="border-b border-slate-700 text-slate-400">
          <tr>
            <th className="px-3 py-3">RM</th>
            <th className="px-3 py-3">Month / Year</th>
            <th className="px-3 py-3">Week</th>
            <th className="px-3 py-3">Brokerage</th>
            <th className="px-3 py-3">RM Sharing</th>
            <th className="px-3 py-3">Screenshot</th>
          </tr>
        </thead>
        <tbody>
          {savedReports.map((report, index) => {
            const rmName =
              typeof report.rmId === "object"
                ? report.rmId?.name || "RM"
                : "RM";

            return (
              <tr
                key={report._id || `${report.year}-${report.month}-${report.week}-${index}`}
                className="border-b border-slate-800"
              >
                <td className="px-3 py-3">{rmName}</td>
                <td className="px-3 py-3">
                  {String(report.month).padStart(2, "0")}/{report.year}
                </td>
                <td className="px-3 py-3">Week {report.week}</td>
                <td className="px-3 py-3">
                  ₹{Number(report.brokerageReceived || 0).toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-3">
                  ₹{Number(report.rmSharingAmount || 0).toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-3">
                  {report.screenshotUrl ? (
                    <a
                      href={getScreenshotUrl(report.screenshotUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline"
                    >
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</section>

      </div>
    </main>
  );
}
