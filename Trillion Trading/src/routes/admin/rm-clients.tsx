
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { rmApi } from "@/lib/rmApi";

export const Route = createFileRoute("/admin/rm-clients")({
  component: RMClientsPage,
});

type RM = {
  _id: string;
  name: string;
  email: string;
};
type Renewal = {
  _id: string;
  rmId: string | RM;
  clientId: string | { _id?: string; name?: string };
  renewalDate: string;
  renewalAmount: number;
  notes?: string;
};
type Client = {
  _id: string;
  rmId: string | RM;
  name: string;
  email?: string;
  mobile: string;
  isActive?: boolean;
};

type RMResponse = {
  rms?: RM[];
};

type ClientResponse = {
  clients?: Client[];
};

function RMClientsPage() {
  const [rms, setRms] = useState<RM[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [rmId, setRmId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  const [renewalRM, setRenewalRM] = useState("");
  const [clientId, setClientId] = useState("");
  const [renewalDate, setRenewalDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [renewalAmount, setRenewalAmount] = useState("");
  const [renewalNotes, setRenewalNotes] = useState("");

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-emerald-400";

 
async function loadData() {
  setLoading(true);
  setError("");

  try {
    const [rmData, clientData, renewalData] = await Promise.all([
      rmApi<RMResponse>("/api/admin/rm/rms"),
      rmApi<ClientResponse>("/api/admin/rm/clients"),
      rmApi<{ renewals?: Renewal[] }>("/api/admin/rm/renewals"),
    ]);

    setRms(rmData.rms || []);
    setClients(clientData.clients || []);
    setRenewals(renewalData.renewals || []);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to load data."
    );
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
    void loadData();
  }, []);

  async function addClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!rmId) {
      setError("Please select an RM.");
      return;
    }

    if (!name.trim() || !mobile.trim()) {
      setError("Client name and mobile number are required.");
      return;
    }

    setSaving(true);

    try {
      await rmApi("/api/admin/rm/clients", {
        method: "POST",
        body: JSON.stringify({
          rmId,
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          firstReferralDate: new Date().toISOString(),
        }),
      });

      setName("");
      setEmail("");
      setMobile("");
      setMessage("Client added successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add client."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addRenewal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    const amount = Number(renewalAmount);

    if (!renewalRM || !clientId) {
      setError("Please select an RM and client.");
      return;
    }

    if (
      !renewalDate ||
      renewalAmount.trim() === "" ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setError("Enter a valid renewal date and amount.");
      return;
    }

    setSaving(true);

    try {
      await rmApi("/api/admin/rm/renewals", {
        method: "POST",
        body: JSON.stringify({
          rmId: renewalRM,
          clientId,
          renewalDate,
          renewalAmount: amount,
          notes: renewalNotes.trim(),
        }),
      });

     setRenewalAmount("");
setRenewalNotes("");
setMessage("Renewal recorded successfully.");

await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record renewal."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredClients = clients.filter((client) => {
    const clientRMId =
      typeof client.rmId === "string"
        ? client.rmId
        : client.rmId?._id;

    return renewalRM !== "" && clientRMId === renewalRM;
  });

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/admin/rm-management"
          className="text-sm text-emerald-400 hover:underline"
        >
          ← Back to RM Management
        </Link>

        <h1 className="mt-5 text-3xl font-bold">
          RM Clients & Renewals
        </h1>
        <p className="mt-2 text-slate-400">
          Manage client referrals and record renewals for each RM.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-800 bg-red-950/40 p-3 text-red-300"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-emerald-300"
          >
            {message}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl font-semibold">Add New Client</h2>
            <form onSubmit={addClient} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm">Assign RM *</label>
                <select
                  className={inputClass}
                  value={rmId}
                  onChange={(e) => setRmId(e.target.value)}
                  required
                >
                  <option value="">Select RM</option>
                  {rms.map((rm) => (
                    <option key={rm._id} value={rm._id}>
                      {rm.name} — {rm.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm">Client Name *</label>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter client name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">Mobile Number *</label>
                <input
                  className={inputClass}
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">Email</label>
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add Client"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl font-semibold">Record Client Renewal</h2>
            <form onSubmit={addRenewal} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm">Select RM *</label>
                <select
                  className={inputClass}
                  value={renewalRM}
                  onChange={(e) => {
                    setRenewalRM(e.target.value);
                    setClientId("");
                  }}
                  required
                >
                  <option value="">Select RM</option>
                  {rms.map((rm) => (
                    <option key={rm._id} value={rm._id}>
                      {rm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm">Select Client *</label>
                <select
                  className={inputClass}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  disabled={!renewalRM}
                >
                  <option value="">Select client</option>
                  {filteredClients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} — {client.mobile}
                    </option>
                  ))}
                </select>

                {renewalRM && filteredClients.length === 0 && (
                  <p className="mt-2 text-xs text-amber-300">
                    No clients found for this RM. Add a client first.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm">Renewal Date *</label>
                <input
                  className={inputClass}
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">
                  Renewal Amount (₹) *
                </label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  value={renewalAmount}
                  onChange={(e) => setRenewalAmount(e.target.value)}
                  placeholder="Enter renewal amount"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">Notes</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={renewalNotes}
                  onChange={(e) => setRenewalNotes(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>

              <button
                type="submit"
                disabled={saving || filteredClients.length === 0}
                className="w-full rounded-lg bg-sky-400 px-4 py-3 font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Renewal"}
              </button>
            </form>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Registered Clients</h2>
            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-slate-400">Loading clients...</p>
          ) : clients.length === 0 ? (
            <p className="py-8 text-slate-400">No clients registered yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Mobile</th>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">Assigned RM</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    const assignedRM =
                      typeof client.rmId === "string"
                        ? rms.find((rm) => rm._id === client.rmId)
                        : client.rmId;

                    return (
                      <tr
                        key={client._id}
                        className="border-b border-slate-800"
                      >
                        <td className="px-3 py-3 font-medium">
                          {client.name}
                        </td>
                        <td className="px-3 py-3">{client.mobile}</td>
                        <td className="px-3 py-3">
                          {client.email || "—"}
                        </td>
                        <td className="px-3 py-3">
                          {assignedRM?.name || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        
<section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-xl font-semibold">Saved Client Renewals</h2>
    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm">
      {renewals.length} Records
    </span>
  </div>

  {renewals.length === 0 ? (
    <p className="mt-5 text-slate-400">
      No renewal records found.
    </p>
  ) : (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="border-b border-slate-700 text-slate-400">
          <tr>
            <th className="px-3 py-3">Client</th>
            <th className="px-3 py-3">RM</th>
            <th className="px-3 py-3">Renewal Date</th>
            <th className="px-3 py-3">Amount</th>
            <th className="px-3 py-3">Notes</th>
          </tr>
        </thead>
        <tbody>
          {renewals.map((renewal) => {
            const client =
              typeof renewal.clientId === "string"
                ? clients.find((item) => item._id === renewal.clientId)
                : renewal.clientId;

            const assignedRM =
              typeof renewal.rmId === "string"
                ? rms.find((item) => item._id === renewal.rmId)
                : renewal.rmId;

            return (
              <tr key={renewal._id} className="border-b border-slate-800">
                <td className="px-3 py-3">
                  {client?.name || "Client"}
                </td>
                <td className="px-3 py-3">
                  {assignedRM?.name || "—"}
                </td>
                <td className="px-3 py-3">
                  {new Date(renewal.renewalDate).toLocaleDateString("en-IN")}
                </td>
                <td className="px-3 py-3 font-semibold text-emerald-400">
                  ₹{Number(renewal.renewalAmount || 0).toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-3">
                  {renewal.notes || "—"}
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
