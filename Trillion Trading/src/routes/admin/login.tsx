import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { adminApi } from "../../lib/adminApi";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await adminApi("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      await navigate({
  to: "/admin",
  replace: true,
});
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            TT
          </div>

          <h1 className="text-2xl font-bold text-white">
            Trillion Trading
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Admin Control Panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-sm text-slate-200"
            >
              Admin Email
            </label>

            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              maxLength={150}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
              placeholder="Enter admin email"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm text-slate-200"
            >
              Password
            </label>

            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In Securely"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Authorized administrators only.
        </p>
      </section>
    </main>
  );
}