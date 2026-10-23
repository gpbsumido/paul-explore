"use client";

import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { queryKeys } from "@/lib/queryKeys";
import { EVAR_CASES, referenceFor } from "@/lib/evar/phantom";
import type { PracticeCase } from "@/lib/evar/scans";
import { useScanCases } from "@/lib/evar/useScanCases";
import { referencesResponseSchema, type ReferenceRow } from "@/lib/evar/references";
import StudyData from "./StudyData";

const FIELDS = [
  { id: "neckDiameter", label: "Neck diameter (mm)" },
  { id: "neckLength", label: "Neck length (mm)" },
  { id: "maxSac", label: "Max sac diameter (mm)" },
  { id: "rightCia", label: "Right common iliac (mm)" },
  { id: "leftCia", label: "Left common iliac (mm)" },
] as const;

type FieldId = (typeof FIELDS)[number]["id"];
type Values = Record<FieldId, string>;

const button =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const field =
  "mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const EMPTY = Object.fromEntries(FIELDS.map((f) => [f.id, ""])) as Values;

/** The phantom's own answers, to a tenth of a millimetre, as form strings. A real scan has none. */
function fallbackValues(c: PracticeCase): Values {
  if (c.kind === "scan") return EMPTY;
  const ref = referenceFor(c);
  return Object.fromEntries(FIELDS.map((f) => [f.id, String(Number(ref[f.id].toFixed(1)))])) as Values;
}

function valuesFrom(c: PracticeCase, row: ReferenceRow | undefined): Values {
  if (!row) return fallbackValues(c);
  return Object.fromEntries(FIELDS.map((f) => [f.id, String(row[f.id])])) as Values;
}

const usable = (value: string) => value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0;

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${url} failed with ${res.status}`);
}

/** One case: its five answers, a note on where they came from, save and reset. */
function CaseForm({ evarCase, row }: { evarCase: PracticeCase; row: ReferenceRow | undefined }) {
  const client = useQueryClient();
  const idBase = useId();
  const [values, setValues] = useState<Values>(() => valuesFrom(evarCase, row));
  const [note, setNote] = useState(row?.note ?? "");
  const url = `/api/evar/admin/references/${encodeURIComponent(evarCase.id)}`;
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.evar.references() });

  const save = useMutation({
    mutationFn: () =>
      send(url, "PUT", {
        ...Object.fromEntries(FIELDS.map((f) => [f.id, Number(values[f.id])])),
        note: note.trim() === "" ? null : note.trim(),
      }),
    onSuccess: refresh,
  });
  const reset = useMutation({
    mutationFn: () => send(url, "DELETE"),
    onSuccess: () => {
      setValues(fallbackValues(evarCase));
      setNote("");
      save.reset();
      return refresh();
    },
  });

  const edit = (update: () => void) => {
    update();
    save.reset();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
      className="p-5"
    >
      <fieldset>
        <legend className="text-lg font-bold text-foreground">{evarCase.title}</legend>
        <p className="mt-1 text-[13px] text-muted">
          {row
            ? `Set by hand, last saved ${new Date(row.updatedAt).toLocaleString()}.`
            : evarCase.kind === "scan"
              ? "A real scan, with no answers yet. It isn't scored until these are saved."
              : "Phantom geometry, computed from the case itself."}
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FIELDS.map((f) => (
            <div key={f.id}>
              <label htmlFor={`${idBase}-${f.id}`} className="text-[13px] text-muted">
                {f.label}
              </label>
              <input
                id={`${idBase}-${f.id}`}
                type="number"
                inputMode="decimal"
                step={0.1}
                min={0.1}
                max={300}
                required
                className={field}
                value={values[f.id]}
                onChange={(e) => edit(() => setValues((v) => ({ ...v, [f.id]: e.target.value })))}
              />
            </div>
          ))}
        </div>

        <label htmlFor={`${idBase}-note`} className="mt-3 block text-[13px] text-muted">
          Note
        </label>
        <input
          id={`${idBase}-note`}
          type="text"
          maxLength={500}
          className={field}
          value={note}
          onChange={(e) => edit(() => setNote(e.target.value))}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className={`${button} border-foreground font-semibold`}
            disabled={!FIELDS.every((f) => usable(values[f.id])) || save.isPending}
          >
            Save <span className="sr-only">{evarCase.title}</span>
          </button>
          {row ? (
            <button type="button" className={button} onClick={() => reset.mutate()} disabled={reset.isPending}>
              {evarCase.kind === "scan" ? "Clear the answers" : "Reset to phantom"}{" "}
              <span className="sr-only">for {evarCase.title}</span>
            </button>
          ) : null}
          <p aria-live="polite" className="text-[13px] text-foreground">
            {save.isSuccess ? "Saved. /evar scores against these now." : null}
            {save.isError || reset.isError ? "Couldn't save just now. Try again in a moment." : null}
          </p>
        </div>
      </fieldset>
    </form>
  );
}

/** Where a case's answers come from, in a few words for its row. */
const statusFor = (c: PracticeCase, row: ReferenceRow | undefined) =>
  row ? "Set by hand" : c.kind === "scan" ? "No answers yet" : "Phantom geometry";

/**
 * One case in the list: its title and where its answers come from, opening to
 * its form. The form only exists while it's open, so hundreds of cases are
 * hundreds of buttons rather than hundreds of forms.
 */
function CaseRow({
  practiceCase,
  row,
  open,
  onToggle,
}: {
  practiceCase: PracticeCase;
  row: ReferenceRow | undefined;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  return (
    <li className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
      >
        <span className="text-[15px] font-semibold text-foreground">{practiceCase.title}</span>
        <span className={`text-[13px] ${row || practiceCase.kind === "phantom" ? "text-muted" : "font-semibold text-foreground"}`}>
          {statusFor(practiceCase, row)}
        </span>
      </button>
      {open ? (
        <div id={panelId} className="border-t border-border">
          <CaseForm evarCase={practiceCase} row={row} />
        </div>
      ) : null}
    </li>
  );
}

/**
 * Every case, phantoms then scans, with a search and a filter for the scans
 * still waiting on answers, which is the list an admin works through.
 */
function CaseList({ references }: { references: readonly ReferenceRow[] }) {
  const { scans } = useScanCases();
  const [search, setSearch] = useState("");
  const [needsAnswersOnly, setNeedsAnswersOnly] = useState(false);
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const rows = new Map(references.map((r) => [r.caseId, r]));
  const all: readonly PracticeCase[] = [...EVAR_CASES, ...scans];
  const needsAnswers = (c: PracticeCase) => c.kind === "scan" && !rows.has(c.id);
  const term = search.trim().toLowerCase();
  const matches = (c: PracticeCase) => term === "" || c.title.toLowerCase().includes(term) || c.id.includes(term);
  // A row you've opened stays listed, so saving it under "needs answers" doesn't whisk it away mid-edit.
  const shown = all.filter((c) => openIds.has(c.id) || (matches(c) && (!needsAnswersOnly || needsAnswers(c))));

  return (
    <>
      <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
        <label className="flex-1 text-[13px] text-muted">
          Find a case
          <input type="search" className={field} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title or id" />
        </label>
        <label className="flex items-center gap-2 pb-2 text-[14px] text-foreground">
          <input type="checkbox" checked={needsAnswersOnly} onChange={(e) => setNeedsAnswersOnly(e.target.checked)} />
          Only cases that need answers ({all.filter(needsAnswers).length})
        </label>
      </div>
      <p aria-live="polite" className="mt-2 text-[13px] text-muted">
        Showing {shown.length} of {all.length} cases.
      </p>
      <ul className="mt-3 space-y-2">
        {shown.map((c) => (
          <CaseRow key={c.id} practiceCase={c} row={rows.get(c.id)} open={openIds.has(c.id)} onToggle={() => toggle(c.id)} />
        ))}
      </ul>
    </>
  );
}

/**
 * Admin-only editing of the five reference answers per EVAR case. A saved row
 * wins over the phantom's geometry for everyone practising; resetting deletes
 * it and the phantom's own answer comes back. A real scan has no geometry, so
 * it isn't scored until its row is saved.
 */
export default function AdminReferencesContent() {
  const references = useQuery({
    queryKey: queryKeys.evar.references(),
    queryFn: async () => {
      const res = await fetch("/api/evar/references");
      if (!res.ok) throw new Error(`GET /api/evar/references failed with ${res.status}`);
      return referencesResponseSchema.parse(await res.json()).references;
    },
  });

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "EVAR Sizing", href: "/evar" }, { label: "Admin" }]}
        maxWidth="max-w-3xl"
      />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">EVAR admin</h1>

        <StudyData />

        <h2 className="mt-10 text-xl font-bold text-foreground">Reference answers</h2>
        <p className="mt-2 text-[14px] text-muted">
          What each case is scored against. Saving a case overrides its phantom geometry for
          everyone, straight away. Recorded attempts keep the reference they were scored with.
        </p>

        {references.isPending ? <p className="mt-6 text-[14px] text-muted">Loading references…</p> : null}
        {references.isError ? (
          <p className="mt-6 text-[14px] text-foreground">Couldn&apos;t load the references. Try reloading.</p>
        ) : null}
        {references.data ? <CaseList references={references.data} /> : null}
      </main>
    </div>
  );
}
