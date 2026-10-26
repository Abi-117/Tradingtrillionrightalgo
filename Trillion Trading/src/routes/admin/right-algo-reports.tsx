
import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { adminApi } from "../../lib/adminApi";

export const Route = createFileRoute("/admin/right-algo-reports")({
  component: RightAlgoReports,
});

type Report = {
  _id: string;
  title: string;
  description?: string;
  reportDate: string;
  imageUrl: string;
  published: boolean;
};

function RightAlgoReports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState<Report[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reportDate, setReportDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [published, setPublished] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      const response = await adminApi<any>(
        "/api/admin/right-algo/reports"
      );
      setReports(response.reports ?? []);
    } catch (err) {
      const text =
        err instanceof Error ? err.message : "Unable to load reports";

      setError(text);

      if (/session|login|unauthorized/i.test(text)) {
        await navigate({ to: "/admin/login", replace: true });
      }
    }
  }

  useEffect(() => {
    void loadReports();
    // Load reports once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!image) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!image) {
      setError("Please select a report image.");
      return;
    }

    if (image.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("reportDate", reportDate);
      formData.append("published", String(published));

      const apiUrl = (
        import.meta.env.VITE_API_URL || "https://tradingtrillionrightalgo.onrender.com"
      ).replace(/\/$/, "");

      const response = await fetch(
        `${apiUrl}/api/admin/right-algo/reports`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Report upload failed.");
      }

      setMessage("Right Algo report uploaded successfully.");
      setTitle("");
      setDescription("");
      setImage(null);
      setPublished(false);

      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  async function togglePublished(report: Report) {
    setError("");
    setMessage("");

    try {
      await adminApi(`/api/admin/right-algo/reports/${report._id}`, {
        method: "PATCH",
        body: JSON.stringify({ published: !report.published }),
      });

      setMessage(
        report.published ? "Report unpublished." : "Report published."
      );

      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function deleteReport(report: Report) {
    if (!window.confirm(`Delete "${report.title}" permanently?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await adminApi(`/api/admin/right-algo/reports/${report._id}`, {
        method: "DELETE",
      });

      setMessage("Right Algo report deleted.");
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-purple-500";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <h1 className="text-xl font-bold">Right Algo Daily Reports</h1>
            <p className="mt-1 text-sm text-slate-400">
              Upload and manage Right Algo report images.
            </p>
          </div>

          <button
            onClick={() =>
              void navigate({ to: "/admin/right-algo-dashboard" })
            }
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            Back to Right Algo Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        {error && (
          <p role="alert" className="rounded-lg bg-red-950 p-4 text-red-300">
            {error}
          </p>
        )}

        {message && (
          <p className="rounded-lg bg-emerald-950 p-4 text-emerald-300">
            {message}
          </p>
        )}

        <form
          onSubmit={handleUpload}
          className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <h2 className="text-lg font-semibold">Upload New Report</h2>

          <label className="block text-sm text-slate-300">
            Report Title
            <input
              className={inputClass}
              required
              minLength={2}
              maxLength={150}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Right Algo Daily Market Report"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Description
            <textarea
              className={inputClass}
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Report summary..."
            />
          </label>

          <label className="block text-sm text-slate-300">
            Report Date
            <input
              className={inputClass}
              type="date"
              required
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
            />
          </label>

          <label className="block text-sm text-slate-300">
            Report Image (JPG, PNG, WebP — max 5 MB)
            <input
              className="mt-2 block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:font-semibold file:text-white"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(event) =>
                setImage(event.target.files?.[0] ?? null)
              }
            />
          </label>

          {preview && (
            <div>
              <p className="mb-2 text-sm text-slate-400">Image Preview</p>
              <img
                src={preview}
                alt="Selected report preview"
                className="max-h-96 rounded-lg border border-slate-700 object-contain"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />
            Publish immediately
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Report"}
          </button>
        </form>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Uploaded Reports</h2>

          {reports.length === 0 ? (
            <p className="text-slate-400">No Right Algo reports uploaded yet.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <article
                  key={report._id}
                  className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
                >
                  <img
                    src={report.imageUrl}
                    alt={report.title}
                    className="h-52 w-full object-cover"
                  />

                  <div className="space-y-3 p-4">
                    <h3 className="font-semibold">{report.title}</h3>

                    <p className="text-sm text-slate-400">
                      {new Date(report.reportDate).toLocaleDateString("en-IN")}
                    </p>

                    {report.description && (
                      <p className="text-sm text-slate-400">
                        {report.description}
                      </p>
                    )}

                    <p className="text-sm">
                      {report.published ? "Published" : "Draft"}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => void togglePublished(report)}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                      >
                        {report.published ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        onClick={() => void deleteReport(report)}
                        className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-300 hover:bg-red-950"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
