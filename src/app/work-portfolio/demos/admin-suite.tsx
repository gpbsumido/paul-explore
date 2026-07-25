"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { usePersistentState } from "@/hooks/usePersistentState";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #f472b6)";

const ROLES = ["Owner", "Admin", "Analyst", "Viewer"] as const;
type Role = (typeof ROLES)[number];
const ROLE_TINT: Record<Role, string> = {
  Owner: "#f472b6",
  Admin: "#60a5fa",
  Analyst: "#34d399",
  Viewer: "#94a3b8",
};

type Org = { id: string; name: string };
type User = { id: string; name: string; email: string; role: Role; orgId: string };
type ApiKey = { id: string; label: string; key: string; userId: string };
type Config = { id: string; name: string; value: string; orgId: string };

const TABS = ["Users", "Orgs", "Keys", "Configs"] as const;
type Tab = (typeof TABS)[number];

const INIT_ORGS: Org[] = [
  { id: "o1", name: "Nova Studio" },
  { id: "o2", name: "Pixel Forge" },
];
const INIT_USERS: User[] = [
  { id: "u1", name: "Ana P.", email: "ana@studio.example", role: "Owner", orgId: "o1" },
  { id: "u2", name: "Devon R.", email: "devon@studio.example", role: "Admin", orgId: "o1" },
  { id: "u3", name: "Kim L.", email: "kim@studio.example", role: "Analyst", orgId: "o2" },
  { id: "u4", name: "Sam W.", email: "sam@studio.example", role: "Viewer", orgId: "o2" },
];
const INIT_KEYS: ApiKey[] = [
  { id: "k1", label: "Production", key: "sk_live_9f2a_7c41_demo_only_not_real", userId: "u1" },
];
const INIT_CONFIGS: Config[] = [
  { id: "c1", name: "data_retention_days", value: "90", orgId: "o1" },
];

const uid = (prefix: string) =>
  `${prefix}${crypto.randomUUID().slice(0, 8)}`;

function genKey(): string {
  return `sk_live_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}_demo`;
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      <span className="font-medium text-foreground">{label}</span>
      <select
        aria-label={label}
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-[13px] text-foreground"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function initialFields(
  tab: Tab,
  orgs: Org[],
  users: User[],
): Record<string, string> {
  if (tab === "Users")
    return { name: "", email: "", role: ROLES[3], orgId: orgs[0]?.id ?? "" };
  if (tab === "Orgs") return { name: "" };
  if (tab === "Keys") return { label: "", userId: users[0]?.id ?? "" };
  return { name: "", value: "", orgId: orgs[0]?.id ?? "" };
}

/** A compact inline select used to reassign a row's org/owner in place. */
function RowSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-[7rem] shrink-0 truncate rounded border border-border bg-surface px-1 py-0.5 text-[10px] text-muted"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** The create form for whichever entity tab is active. Users/keys/configs
 *  carry an assignment (org or user) set right here at creation. */
function CreateModal({
  tab,
  orgs,
  users,
  onClose,
  onCreate,
}: {
  tab: Tab;
  orgs: Org[];
  users: User[];
  onClose: () => void;
  onCreate: (payload: Record<string, string>) => void;
}) {
  const [fields, setFields] = useState<Record<string, string>>(() =>
    initialFields(tab, orgs, users),
  );
  const set = (patch: Record<string, string>) =>
    setFields((f) => ({ ...f, ...patch }));

  const required =
    tab === "Users"
      ? fields.name.trim() && fields.email.trim()
      : tab === "Orgs"
        ? fields.name.trim()
        : tab === "Keys"
          ? fields.label.trim()
          : fields.name.trim();

  return (
    <Modal open onClose={onClose} aria-label={`New ${tab}`}>
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
          New {tab.replace(/s$/, "").toLowerCase()}
        </p>

        {tab === "Users" && (
          <>
            <Input label="Name" size="sm" value={fields.name} onChange={(e) => set({ name: e.target.value })} />
            <Input label="Email" size="sm" value={fields.email} onChange={(e) => set({ email: e.target.value })} />
            <SelectField label="Role" value={fields.role} onChange={(role) => set({ role })} options={ROLES.map((r) => ({ id: r, label: r }))} />
            <SelectField label="Org" value={fields.orgId} onChange={(orgId) => set({ orgId })} options={orgs.map((o) => ({ id: o.id, label: o.name }))} />
          </>
        )}
        {tab === "Orgs" && (
          <Input label="Name" size="sm" value={fields.name} onChange={(e) => set({ name: e.target.value })} />
        )}
        {tab === "Keys" && (
          <>
            <Input label="Label" size="sm" value={fields.label} onChange={(e) => set({ label: e.target.value })} />
            <SelectField label="Owner" value={fields.userId} onChange={(userId) => set({ userId })} options={users.map((u) => ({ id: u.id, label: u.name }))} />
          </>
        )}
        {tab === "Configs" && (
          <>
            <Input label="Key" size="sm" value={fields.name} onChange={(e) => set({ name: e.target.value })} />
            <Input label="Value" size="sm" value={fields.value} onChange={(e) => set({ value: e.target.value })} />
            <SelectField label="Org" value={fields.orgId} onChange={(orgId) => set({ orgId })} options={orgs.map((o) => ({ id: o.id, label: o.name }))} />
          </>
        )}

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!required} onClick={() => onCreate(fields)}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Vignette: the platform console's admin suite. A tabbed console for orgs,
 * users, API keys, and configs: create each (users/keys/configs carry an
 * assignment), reveal and copy keys, all against a local mock store.
 */
export default function AdminSuiteDemo({ feature }: { feature: WorkFeature }) {
  // The console persists to localStorage (local memory), never a backend.
  const [orgs, setOrgs] = usePersistentState<Org[]>("wp-admin-orgs", INIT_ORGS);
  const [users, setUsers] = usePersistentState<User[]>("wp-admin-users", INIT_USERS);
  const [keys, setKeys] = usePersistentState<ApiKey[]>("wp-admin-keys", INIT_KEYS);
  const [configs, setConfigs] = usePersistentState<Config[]>("wp-admin-configs", INIT_CONFIGS);
  const [tab, setTab] = useState<Tab>("Users");
  const [creating, setCreating] = useState<Tab | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const create = (payload: Record<string, string>) => {
    if (tab === "Users") {
      setUsers((u) => [
        ...u,
        { id: uid("u"), name: payload.name, email: payload.email, role: payload.role as Role, orgId: payload.orgId },
      ]);
    } else if (tab === "Orgs") {
      setOrgs((o) => [...o, { id: uid("o"), name: payload.name }]);
    } else if (tab === "Keys") {
      setKeys((k) => [...k, { id: uid("k"), label: payload.label, key: genKey(), userId: payload.userId }]);
    } else {
      setConfigs((c) => [...c, { id: uid("c"), name: payload.name, value: payload.value, orgId: payload.orgId }]);
    }
    setCreating(null);
  };

  const reassignUser = (id: string, orgId: string) =>
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, orgId } : u)));
  const reassignKey = (id: string, userId: string) =>
    setKeys((ks) => ks.map((k) => (k.id === id ? { ...k, userId } : k)));
  const reassignConfig = (id: string, orgId: string) =>
    setConfigs((cs) => cs.map((c) => (c.id === id ? { ...c, orgId } : c)));

  const orgOptions = orgs.map((o) => ({ id: o.id, label: o.name }));
  const userOptions = users.map((u) => ({ id: u.id, label: u.name }));

  const toggleReveal = (id: string) =>
    setRevealed((r) => {
      const next = new Set(r);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">
          {feature.title}
        </p>
        <button
          type="button"
          onClick={() => setCreating(tab)}
          className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
          style={{ backgroundColor: ACCENT }}
        >
          New {tab.replace(/s$/, "").toLowerCase()}
        </button>
      </div>

      <div role="tablist" className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-[12px] ${
              tab === t
                ? "border-current text-foreground"
                : "border-transparent text-muted"
            }`}
            style={tab === t ? { color: ACCENT } : undefined}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "Users" && (
          <ul aria-label="Users" className="divide-y divide-border text-[12px]">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="min-w-0">
                  <span className="block truncate text-foreground">{u.name}</span>
                  <span className="text-[10px] text-muted">{u.email}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <RowSelect
                    label={`Org for ${u.name}`}
                    value={u.orgId}
                    onChange={(orgId) => reassignUser(u.id, orgId)}
                    options={orgOptions}
                  />
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: ROLE_TINT[u.role] }}
                  >
                    {u.role}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {tab === "Orgs" && (
          <ul aria-label="Orgs" className="divide-y divide-border text-[12px]">
            {orgs.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-1.5">
                <span className="text-foreground">{o.name}</span>
                <span className="text-[10px] text-muted">
                  {users.filter((u) => u.orgId === o.id).length} users ·{" "}
                  {configs.filter((c) => c.orgId === o.id).length} configs
                </span>
              </li>
            ))}
          </ul>
        )}

        {tab === "Keys" && (
          <ul aria-label="Keys" className="divide-y divide-border text-[12px]">
            {keys.map((k) => (
              <li key={k.id} className="flex flex-col gap-1 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-foreground">{k.label}</span>
                  <RowSelect
                    label={`Owner for ${k.label}`}
                    value={k.userId}
                    onChange={(userId) => reassignKey(k.id, userId)}
                    options={userOptions}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded bg-black/5 px-2 py-1 font-mono text-[11px] text-foreground dark:bg-white/10">
                    {revealed.has(k.id) ? k.key : "•".repeat(28)}
                  </code>
                  <Button variant="outline" size="xs" onClick={() => toggleReveal(k.id)}>
                    {revealed.has(k.id) ? "Hide" : "Reveal"}
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setCopiedId(k.id);
                      setTimeout(() => setCopiedId(null), 1200);
                    }}
                  >
                    {copiedId === k.id ? "Copied" : "Copy"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "Configs" && (
          <ul aria-label="Configs" className="divide-y divide-border text-[12px]">
            {configs.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="min-w-0">
                  <code className="font-mono text-foreground">{c.name}</code>
                  <span className="ml-2 text-muted">= {c.value}</span>
                </span>
                <RowSelect
                  label={`Org for ${c.name}`}
                  value={c.orgId}
                  onChange={(orgId) => reassignConfig(c.id, orgId)}
                  options={orgOptions}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {creating && (
        <CreateModal
          tab={creating}
          orgs={orgs}
          users={users}
          onClose={() => setCreating(null)}
          onCreate={create}
        />
      )}
    </div>
  );
}
