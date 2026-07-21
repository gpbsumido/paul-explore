"use client";

import { useReducer, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #e879f9)";

type Status = "Draft" | "Live";
type Campaign = {
  id: number;
  name: string;
  objective: string;
  audience: string;
  sendDate: string;
  status: Status;
};

type Draft = Pick<Campaign, "name" | "objective" | "audience" | "sendDate">;

/** One dispatched action, kept so the inspector can show the store updating. */
type LogEntry = { seq: number; type: string; detail: string };

type State = {
  campaigns: Campaign[];
  nextId: number;
  log: LogEntry[];
  seq: number;
};
type Action = { type: "created"; draft: Draft } | { type: "toggled"; id: number };

const LOG_CAP = 6;

const INITIAL: State = {
  nextId: 3,
  seq: 1,
  log: [{ seq: 0, type: "@@INIT", detail: "2 campaigns hydrated" }],
  campaigns: [
    {
      id: 1,
      name: "Launch week push",
      objective: "Awareness",
      audience: "All players",
      sendDate: "2026-01-15",
      status: "Live",
    },
    {
      id: 2,
      name: "Creator spotlight",
      objective: "Engagement",
      audience: "Creators",
      sendDate: "2026-02-01",
      status: "Draft",
    },
  ],
};

function withLog(state: State, type: string, detail: string): LogEntry[] {
  return [{ seq: state.seq, type, detail }, ...state.log].slice(0, LOG_CAP);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "created": {
      const campaign: Campaign = {
        id: state.nextId,
        status: "Draft",
        ...action.draft,
      };
      return {
        ...state,
        nextId: state.nextId + 1,
        seq: state.seq + 1,
        campaigns: [campaign, ...state.campaigns],
        log: withLog(state, "campaign/created", campaign.name),
      };
    }
    case "toggled": {
      const campaigns: Campaign[] = state.campaigns.map((c) =>
        c.id === action.id
          ? { ...c, status: c.status === "Live" ? "Draft" : "Live" }
          : c,
      );
      const toggled = campaigns.find((c) => c.id === action.id);
      return {
        ...state,
        seq: state.seq + 1,
        campaigns,
        log: withLog(
          state,
          "campaign/toggled",
          toggled ? `${toggled.name} → ${toggled.status}` : "",
        ),
      };
    }
  }
}

const OBJECTIVES = ["Awareness", "Engagement", "Retention"];
const AUDIENCES = ["All players", "Creators", "New signups", "Lapsed"];
const STEPS = ["Basics", "Targeting", "Review"];
const EMPTY_DRAFT: Draft = {
  name: "",
  objective: OBJECTIVES[0],
  audience: AUDIENCES[0],
  sendDate: "",
};

function Field({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      <span className="font-medium text-foreground">{label}</span>
      <select
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-[13px] text-foreground"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

/**
 * A stepped create flow: basics, then targeting/schedule, then a review before
 * it commits, standing in for the original's multi-route create wizard.
 */
function CreateCampaignModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (draft: Draft) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const reset = () => {
    setStep(0);
    setDraft(EMPTY_DRAFT);
  };
  const close = () => {
    reset();
    onClose();
  };
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const canAdvance =
    step === 0
      ? draft.name.trim().length > 0
      : step === 1
        ? draft.sendDate !== ""
        : true;

  const submit = () => {
    onCreate({ ...draft, name: draft.name.trim() });
    reset();
  };

  return (
    <Modal open={open} onClose={close} aria-label="Create campaign">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            New campaign
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col gap-1">
                <div
                  className="h-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: i <= step ? ACCENT : "var(--color-border)",
                  }}
                />
                <span
                  className={`text-[10px] ${i === step ? "text-foreground" : "text-muted"}`}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-3">
            <Input
              label="Campaign name"
              size="sm"
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="name a campaign"
            />
            <Field
              label="Objective"
              value={draft.objective}
              options={OBJECTIVES}
              onChange={(objective) => set({ objective })}
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <Field
              label="Audience"
              value={draft.audience}
              options={AUDIENCES}
              onChange={(audience) => set({ audience })}
            />
            <Input
              type="date"
              label="Send date"
              size="sm"
              value={draft.sendDate}
              onChange={(e) => set({ sendDate: e.target.value })}
            />
          </div>
        )}

        {step === 2 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
            <dt className="text-muted">Name</dt>
            <dd className="text-foreground">{draft.name}</dd>
            <dt className="text-muted">Objective</dt>
            <dd className="text-foreground">{draft.objective}</dd>
            <dt className="text-muted">Audience</dt>
            <dd className="text-foreground">{draft.audience}</dd>
            <dt className="text-muted">Send date</dt>
            <dd className="text-foreground">{draft.sendDate}</dd>
          </dl>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={step === 0 ? close : () => setStep((s) => s - 1)}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <button
              type="button"
              onClick={submit}
              className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
              style={{ backgroundColor: ACCENT }}
            >
              Create campaign
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/**
 * A mini redux-devtools: the dispatched-action log and a snapshot of the
 * store, so the state flow is visible as you create and toggle campaigns.
 */
function StoreInspector({ state }: { state: State }) {
  const snapshot = {
    campaigns: state.campaigns.length,
    live: state.campaigns.filter((c) => c.status === "Live").length,
    draft: state.campaigns.filter((c) => c.status === "Draft").length,
    nextId: state.nextId,
  };
  return (
    <div className="flex min-h-0 flex-col gap-2 rounded-lg border border-border bg-surface/40 p-3 font-mono">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
        Store
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-1 text-[10px] text-muted">actions</p>
        <ul className="space-y-1">
          {state.log.map((entry) => (
            <li
              key={entry.seq}
              className="flex items-baseline gap-2 text-[11px]"
            >
              <span className="text-muted">#{entry.seq}</span>
              <span style={{ color: ACCENT }}>{entry.type}</span>
              {entry.detail && (
                <span className="truncate text-muted">{entry.detail}</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mb-1 mt-3 text-[10px] text-muted">state</p>
        <pre className="whitespace-pre-wrap break-words text-[10px] leading-relaxed text-foreground">
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      </div>
    </div>
  );
}

/**
 * Vignette: the content engine's campaign manager. A campaign list with an
 * inline status toggle and a stepped create modal (progressive disclosure),
 * next to a live store inspector, standing in for the original's CRUD routes.
 */
export default function CampaignManagerDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">
          {feature.title}
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
          style={{ backgroundColor: ACCENT }}
        >
          New campaign
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-2">
        <ul
          aria-label="Campaigns"
          className="min-h-0 divide-y divide-border overflow-y-auto"
        >
        {state.campaigns.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 py-2">
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-foreground">
                {c.name}
              </span>
              <span className="text-[11px] text-muted">
                {c.objective} · {c.audience}
              </span>
            </span>
            <button
              type="button"
              aria-label={`Toggle ${c.name}`}
              onClick={() => dispatch({ type: "toggled", id: c.id })}
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{
                backgroundColor: c.status === "Live" ? "#34d399" : "#94a3b8",
              }}
            >
              {c.status}
            </button>
          </li>
        ))}
        </ul>
        <StoreInspector state={state} />
      </div>

      <CreateCampaignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(draft) => {
          dispatch({ type: "created", draft });
          setModalOpen(false);
        }}
      />
    </div>
  );
}
