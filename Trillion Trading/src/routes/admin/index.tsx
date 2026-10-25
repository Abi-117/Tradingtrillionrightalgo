
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminBusinessSelection,
});

function AdminBusinessSelection() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12 text-white">
      <section className="w-full max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold">
            Admin Control Panel
          </h1>
          <p className="mt-3 text-slate-400">
            Select a section to manage your business
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Trillion Trading */}
          <button
            type="button"
            onClick={() => void navigate({ to: "/admin/dashboard" })}
            className="rounded-2xl border border-indigo-500/40 bg-slate-900 p-7 text-left transition hover:border-indigo-400 hover:bg-slate-800"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold">
              TT
            </div>

            <h2 className="text-xl font-bold">
              Trillion Trading
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              View Trillion Trading orders, payments and reports.
            </p>

            <span className="mt-6 inline-block font-semibold text-indigo-400">
              Open Dashboard →
            </span>
          </button>

          {/* Right Algo Trading */}
          <button
            type="button"
            onClick={() =>
              void navigate({ to: "/admin/right-algo-dashboard" })
            }
            className="rounded-2xl border border-purple-500/40 bg-slate-900 p-7 text-left transition hover:border-purple-400 hover:bg-slate-800"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-600 text-xl font-bold">
              RA
            </div>

            <h2 className="text-xl font-bold">
              Right Algo Trading
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Manage Right Algo registrations, payments and software orders.
            </p>

            <span className="mt-6 inline-block font-semibold text-purple-400">
              Open Dashboard →
            </span>
          </button>

          {/* Student Login Details */}
          <button
            type="button"
            onClick={() =>
              void navigate({ to: "/admin/students" })
            }
            className="rounded-2xl border border-emerald-500/40 bg-slate-900 p-7 text-left transition hover:border-emerald-400 hover:bg-slate-800"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold">
              ST
            </div>

            <h2 className="text-xl font-bold">
              Student Login Details
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              View registered students, purchased products and payment status
              for both businesses.
            </p>

            <span className="mt-6 inline-block font-semibold text-emerald-400">
              View Students →
            </span>
          </button>
        </div>
        <div>
            <Link
  to="/admin/rm-management"
  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
>
  <span>👥</span>
  <span>RM Management</span>
</Link>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Authorized administrators only.
        </p>
      </section>
    </main>
  );
}
