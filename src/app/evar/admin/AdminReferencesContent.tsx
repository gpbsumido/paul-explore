"use client";

import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { queryKeys } from "@/lib/queryKeys";
import { EVAR_CASES, referenceFor, type EvarCase } from "@/lib/evar/phantom";
import { referencesResponseSchema, type ReferenceRow } from "@/lib/evar/references";

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

/** The phantom's own answers, to a tenth of a millimetre, as form strings. */
function phantomValues(c: EvarCase): Values {
  const ref = referenceFor(c);
  return Object.fromEntries(FIELDS.map((f) => [f.id, String(Number(ref[f.id].toFixed(1)))])) as Values;
}

function valuesFrom(c: EvarCase, row: ReferenceRow | undefined): Values {
  if (!row) return phantomValues(c);
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
function CaseForm({ evarCase, row }: { evarCase: EvarCase; row: ReferenceRow | undefined }) {
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
      setValues(phantomValues(evarCase));
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
      className="rounded-xl border border-border bg-surface p-5"
    >
      <fieldset>
        <legend className="text-lg font-bold text-foreground">{evarCase.title}</legend>
        <p className="mt-1 text-[13px] text-muted">
          {row
            ? `Set by hand, last saved ${new Date(row.updatedAt).toLocaleString()}.`
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
              Reset to phantom <span className="sr-only">for {evarCase.title}</span>
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

/**
 * Admin-only editing of the five reference answers per EVAR case. A saved row
 * wins over the phantom's geometry for everyone practising; resetting deletes
 * it and the phantom's own answer comes back.
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
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "EVAR Sizing", href: "/evar" }, { label: "References" }]}
        maxWidth="max-w-3xl"
      />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">EVAR reference answers</h1>
        <p className="mt-2 text-[14px] text-muted">
          What each case is scored against. Saving a case overrides its phantom geometry for
          everyone, straight away. Recorded attempts keep the reference they were scored with.
        </p>

        {references.isPending ? <p className="mt-6 text-[14px] text-muted">Loading references…</p> : null}
        {references.isError ? (
          <p className="mt-6 text-[14px] text-foreground">Couldn&apos;t load the references. Try reloading.</p>
        ) : null}
        {references.data ? (
          <div className="mt-6 space-y-6">
            {EVAR_CASES.map((c) => (
              <CaseForm key={c.id} evarCase={c} row={references.data.find((r) => r.caseId === c.id)} />
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
