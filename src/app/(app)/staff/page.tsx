"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { RoleBadge } from "@/components/RoleBadge";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AppRole } from "@/lib/permissions";
import type { User } from "@/lib/types";

const empty = {
  name: "",
  email: "",
  password: "password123",
  role: "ATTENDANT" as AppRole,
};

export default function StaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [staff, auth] = await Promise.all([
      api<{ users: User[] }>("/api/users"),
      api<{ user: User }>("/api/auth/me"),
    ]);
    setUsers(staff.users ?? []);
    setMe(auth.user);
  }, []);

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [load]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await api("/api/users", { method: "POST", json: form });
      setOpen(false);
      setForm(empty);
      await load();
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const canInvite = me?.role === "OWNER";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            Staff
          </h2>
          <p className="mt-1 text-sm text-muted">
            Role-based access like StockApp — attendant, manager, owner.
          </p>
        </div>
        {canInvite ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-dark"
          >
            <Plus className="h-4 w-4" /> Invite staff
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <DataTable
        loading={loading}
        rows={users}
        rowKey={(r) => r.id}
        columns={[
          { key: "n", header: "Name", render: (r) => r.name },
          { key: "e", header: "Email", render: (r) => r.email },
          {
            key: "r",
            header: "Role",
            render: (r) => <RoleBadge role={r.role} />,
          },
          {
            key: "a",
            header: "Status",
            render: (r) => (r.active === false ? "Inactive" : "Active"),
          },
          {
            key: "c",
            header: "Joined",
            render: (r) => formatDate(r.createdAt),
          },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite staff member"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "Create account"}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Full name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Temporary password</span>
            <input
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              className="w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Role</span>
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as AppRole }))
              }
              className="w-full rounded-xl border border-border px-3 py-2"
            >
              <option value="ATTENDANT">Store Attendant</option>
              <option value="MANAGER">Store Manager</option>
              <option value="OWNER">Store Owner</option>
            </select>
          </label>
        </div>
      </Modal>
    </div>
  );
}
