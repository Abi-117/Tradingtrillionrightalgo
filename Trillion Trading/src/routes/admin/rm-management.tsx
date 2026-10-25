
import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { adminApi } from "@/lib/adminApi";
import { Link } from "@tanstack/react-router";


export const Route = createFileRoute("/admin/rm-management")({
  component: RMManagementPage,
});

type RM = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  mobile: string;
  isActive: boolean;
  createdAt?: string;
};

type RMListResponse = {
  success: boolean;
  rms: RM[];
  message?: string;
};

function RMManagementPage() {
  const navigate = useNavigate();

  const [rms, setRms] = useState<RM[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadRMs() {
    setLoading(true);
    setError("");

    try {
      const result = await adminApi<RMListResponse>("/api/admin/rm/rms");

      if (!result.success) {
        throw new Error(result.message || "Unable to load RM accounts.");
      }

      setRms(result.rms || []);
    } catch (err) {
      const text =
        err instanceof Error ? err.message : "Unable to load RM accounts.";

      setError(text);

      if (/unauthorized|session expired|please log in/i.test(text)) {
        await navigate({ to: "/admin/login", replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRMs();
    // Load RM accounts when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createRM(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await adminApi<{ success: boolean; message?: string }>(
        "/api/admin/rm/rms",
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            password,
          }),
        },
      );

      if (!result.success) {
        throw new Error(result.message || "Could not create RM account.");
      }

      setName("");
      setEmail("");
      setMobile("");
      setPassword("");
      setMessage("RM account created successfully.");

      await loadRMs();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create RM account.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(rm: RM) {
    const rmId = rm._id || rm.id;

    if (!rmId) {
      setError("RM ID is missing from the API response.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const result = await adminApi<{ success: boolean; message?: string }>(
        `/api/admin/rm/rms/${rmId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: !rm.isActive }),
        },
      );

      if (!result.success) {
        throw new Error(result.message || "Unable to update RM status.");
      }

      setMessage(`RM account ${rm.isActive ? "disabled" : "activated"}.`);
      await loadRMs();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update RM status.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Main Admin Control
            </p>
            <h1 className="mt-2 text-3xl font-bold">RM Management</h1>
            <p className="mt-2 text-sm text-slate-400">
              Create and manage RM login accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void navigate({ to: "/admin/" })}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            Back to Admin
          </button>
          <Link
  to="/admin/rm-clients"
  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
>
  <span>👥</span>
  <span>RM Clients & Renewals</span>
</Link>
<Link
  to="/admin/rm-weekly-report"
  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
>
  <span>📊</span>
  <span>RM Weekly Report</span>
</Link>
        </header>

        {message && (
          <p className="mb-5 rounded-lg border border-emerald-800 bg-emerald-950 p-4 text-emerald-300">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="mb-5 rounded-lg border border-red-800 bg-red-950 p-4 text-red-300">
            {error}
          </p>
        )}

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="mb-2 text-xl font-bold">Create New RM Account</h2>
          <p className="mb-6 text-sm text-slate-400">
            The Main Admin creates the login ID and password. There is no public RM signup.
          </p>

          <form onSubmit={createRM} className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm">
              RM Full Name *
              <input
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={100}
                autoComplete="off"
                required
              />
            </label>

            <label className="text-sm">
              Login ID / Email *
              <input
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={150}
                autoComplete="off"
                required
              />
            </label>

            <label className="text-sm">
              Mobile Number *
              <input
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                pattern="\+?[0-9\s()-]{10,15}"
                maxLength={15}
                required
              />
            </label>

            <label className="text-sm">
              Temporary Password *
              <input
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={12}
                maxLength={200}
                autoComplete="new-password"
                required
              />
              <span className="mt-1 block text-xs text-slate-500">
                Use at least 12 characters.
              </span>
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-400 px-6 py-3 font-semibold text-slate-950 disabled:opacity-50"
              >
                {saving ? "Creating account..." : "Create RM Account"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Existing RM Accounts</h2>
              <p className="mt-1 text-sm text-slate-400">
                Total accounts: {rms.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadRMs()}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p className="text-slate-400">Loading RM accounts...</p>
          ) : rms.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-slate-400">
              No RM accounts created yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-3">RM Name</th>
                    <th className="p-3">Login ID</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rms.map((rm) => (
                    <tr
                      key={rm._id || rm.id || rm.email}
                      className="border-t border-slate-800"
                    >
                      <td className="p-3 font-medium">{rm.name}</td>
                      <td className="p-3">{rm.email}</td>
                      <td className="p-3">{rm.mobile}</td>
                      <td className="p-3">
                        <span
                          className={
                            rm.isActive
                              ? "rounded-full bg-emerald-950 px-3 py-1 text-emerald-300"
                              : "rounded-full bg-red-950 px-3 py-1 text-red-300"
                          }
                        >
                          {rm.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => void toggleStatus(rm)}
                          className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800"
                        >
                          {rm.isActive ? "Disable" : "Activate"}
                        </button>
                        
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
        </section>
        
      </div>
    </main>
  );
}
