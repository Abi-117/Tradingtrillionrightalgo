
import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { rmApi } from "@/lib/rmApi";

export const Route = createFileRoute("/rm/login")({
  component: RMLoginPage,
});

function RMLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await rmApi("/api/rm/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      await navigate({ to: "/rm/dashboard" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          RM Brokerage Portal
        </p>
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-sm text-slate-400">
          Sign in to view your clients and monthly brokerage reports.
        </p>

        <label className="block text-sm">
          Email address
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm">
          Password
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          className="w-full rounded-lg bg-emerald-400 p-3 font-semibold text-slate-950 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
