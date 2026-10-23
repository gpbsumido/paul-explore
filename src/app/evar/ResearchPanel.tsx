"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { EVAR_CASES } from "@/lib/evar/phantom";
import { LEVELS } from "@/lib/evar/levels";
import {
  CONSENT_VERSION,
  TRAINING_LEVELS,
  attemptsResponseSchema,
  participantResponseSchema,
  type AttemptPayload,
  type Participant,
} from "@/lib/evar/research";

const button =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const field =
  "mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const clock = (ms: number) => {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

/** Sends JSON and parses the reply, throwing on a non-2xx so react-query sees the failure. */
async function send(url: string, method: string, body?: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${url} failed with ${res.status}`);
  return res.status === 204 ? null : res.json();
}

/** Agreeing to the draft consent and saying where you are in training. */
export function JoinForm({ onJoined }: { onJoined: (participant: Participant) => void }) {
  // The form can be on the page twice, in the first-visit dialog and the panel, so its ids can't be fixed.
  const idBase = useId();
  const [trainingLevel, setTrainingLevel] = useState("");
  const [trainingYear, setTrainingYear] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [agreed, setAgreed] = useState(false);

  const join = useMutation({
    mutationFn: async () =>
      participantResponseSchema.parse(
        await send("/api/evar/participant", "PUT", {
          consentVersion: CONSENT_VERSION,
          trainingLevel,
          trainingYear: trainingYear === "" ? null : Number(trainingYear),
          specialty: specialty.trim() === "" ? null : specialty.trim(),
        }),
      ).participant,
    onSuccess: (participant) => participant && onJoined(participant),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        join.mutate();
      }}
    >
      <div className="rounded-lg border border-border bg-background p-3 text-[13px] leading-relaxed text-muted">
        <p className="font-semibold text-foreground">Draft consent, pending ethics approval</p>
        <p className="mt-2">
          If you join, every attempt you check on this page is saved: your measurements, scores,
          device choices, how long it took, and the training level, year and specialty you give
          below. It&apos;s stored under a random participant id, not your name or email, and only
          ever exported under that id. The aim is to see how sizing accuracy changes with training,
          for publication.
        </p>
        <p className="mt-2">
          Joining is optional and practice works the same without it. You can withdraw from this
          panel at any time, which deletes your profile and every attempt straight away.
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`${idBase}-level`} className="text-[13px] text-muted">
            Training level
          </label>
          <select
            id={`${idBase}-level`}
            className={field}
            value={trainingLevel}
            onChange={(e) => setTrainingLevel(e.target.value)}
          >
            <option value="">Choose one</option>
            {TRAINING_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idBase}-year`} className="text-[13px] text-muted">
            Year of training (optional)
          </label>
          <input
            id={`${idBase}-year`}
            type="number"
            min={1}
            max={15}
            className={field}
            value={trainingYear}
            onChange={(e) => setTrainingYear(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${idBase}-specialty`} className="text-[13px] text-muted">
            Specialty (optional)
          </label>
          <input
            id={`${idBase}-specialty`}
            type="text"
            maxLength={80}
            className={field}
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>
      </div>

      <label className="mt-3 flex items-start gap-2 text-[14px] text-foreground">
        <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        I agree to my attempts being recorded as described above.
      </label>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          className={`${button} border-foreground font-semibold`}
          disabled={!agreed || trainingLevel === "" || join.isPending}
        >
          Join the study
        </button>
        {join.isError ? (
          <p className="text-[13px] text-foreground">Couldn&apos;t join just now. Try again in a moment.</p>
        ) : null}
      </div>
    </form>
  );
}

/** What a participant sees: their record, and the way out. */
function ParticipantView({ participant, onWithdrawn }: { participant: Participant; onWithdrawn: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const attempts = useQuery({
    queryKey: queryKeys.evar.attempts(),
    queryFn: async () => attemptsResponseSchema.parse(await send("/api/evar/attempts", "GET")).attempts,
  });
  const withdraw = useMutation({
    mutationFn: () => send("/api/evar/participant", "DELETE"),
    onSuccess: onWithdrawn,
  });

  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  const level = TRAINING_LEVELS.find((l) => l.value === participant.trainingLevel)?.label ?? participant.trainingLevel;
  const rows = attempts.data ?? [];

  return (
    <div>
      <p className="text-[14px] text-foreground">
        You&apos;re in the study as a {level.toLowerCase()}
        {participant.trainingYear === null ? "" : `, year ${participant.trainingYear}`}. Each attempt
        you check is saved to your record.
      </p>

      {rows.length === 0 ? (
        <p className="mt-3 text-[13px] text-muted">Nothing recorded yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <caption className="mb-1 text-left text-[14px] font-semibold text-foreground">Your recorded attempts</caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-1 pr-3 font-medium">When</th>
                <th scope="col" className="py-1 pr-3 font-medium">Case</th>
                <th scope="col" className="py-1 pr-3 font-medium">Level</th>
                <th scope="col" className="py-1 pr-3 font-medium">Score</th>
                <th scope="col" className="py-1 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="py-1.5 pr-3">{new Date(row.submittedAt).toLocaleDateString()}</td>
                  <td className="py-1.5 pr-3">{EVAR_CASES.find((c) => c.id === row.caseId)?.title ?? row.caseId}</td>
                  <td className="py-1.5 pr-3">{LEVELS.find((l) => l.id === row.level)?.label ?? row.level}</td>
                  <td className="py-1.5 pr-3 font-mono">
                    {row.scores.filter((s) => s.verdict === "within").length} / {row.scores.length}
                  </td>
                  <td className="py-1.5 font-mono">
                    {clock(row.durationMs)}
                    {row.timedOut ? " (time ran out)" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        {confirming ? (
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-[14px] text-foreground">
              This deletes your profile and every recorded attempt. It can&apos;t be undone.
            </p>
            <div className="mt-2 flex gap-2">
              <button type="button" className={`${button} font-semibold`} onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>
                Yes, delete everything
              </button>
              <button ref={keepRef} type="button" className={button} onClick={() => setConfirming(false)}>
                Keep my data
              </button>
            </div>
            {withdraw.isError ? (
              <p className="mt-2 text-[13px] text-foreground">Couldn&apos;t withdraw just now. Try again in a moment.</p>
            ) : null}
          </div>
        ) : (
          <button type="button" className={button} onClick={() => setConfirming(true)}>
            Withdraw and delete my data
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * The opt-in research study, under the practice. Signed out, it explains and
 * offers sign-in. Signed in, it asks for consent first. Once joined, every
 * attempt the page hands it is saved once, keyed by the id the page made when
 * the attempt started.
 */
export default function ResearchPanel({ submission }: { submission: AttemptPayload | null }) {
  const client = useQueryClient();
  const me = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<{ sub: string | null; email: string | null }> =>
      fetch("/api/me").then((r) => (r.ok ? r.json() : { sub: null, email: null })),
    staleTime: 5 * 60_000,
  });
  const signedIn = Boolean(me.data?.sub);
  const participantQuery = useQuery({
    queryKey: queryKeys.evar.participant(),
    queryFn: async () => participantResponseSchema.parse(await send("/api/evar/participant", "GET")).participant,
    enabled: signedIn,
  });
  const participant = participantQuery.data ?? null;

  const save = useMutation({
    mutationFn: (payload: AttemptPayload) => send("/api/evar/attempts", "POST", payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.evar.attempts() }),
  });
  const { mutate } = save;
  const sent = useRef(new Set<string>());

  useEffect(() => {
    if (!participant || !submission || sent.current.has(submission.clientAttemptId)) return;
    sent.current.add(submission.clientAttemptId);
    mutate(submission);
  }, [participant, submission, mutate]);

  const body = () => {
    if (me.isPending || (signedIn && participantQuery.isPending)) {
      return <p className="text-[13px] text-muted">Checking whether you&apos;ve joined…</p>;
    }
    if (!signedIn) {
      return (
        <p className="text-[14px] text-muted">
          Practising doesn&apos;t need an account. If you&apos;d like your results to count towards
          a study of how sizing skill develops over training,{" "}
          <a href="/auth/login?returnTo=%2Fevar" className="text-foreground underline underline-offset-2">
            sign in to join the study
          </a>
          .
        </p>
      );
    }
    if (participantQuery.isError) {
      return <p className="text-[13px] text-muted">The study isn&apos;t reachable right now. Practice still works.</p>;
    }
    if (!participant) {
      return <JoinForm onJoined={(joined) => client.setQueryData(queryKeys.evar.participant(), joined)} />;
    }
    return (
      <ParticipantView
        participant={participant}
        onWithdrawn={() => {
          client.setQueryData(queryKeys.evar.participant(), null);
          client.removeQueries({ queryKey: queryKeys.evar.attempts() });
        }}
      />
    );
  };

  return (
    <section aria-labelledby="evar-research-heading" className="mt-10 rounded-xl border border-border bg-surface p-5">
      <h2 id="evar-research-heading" className="mb-2 text-lg font-bold text-foreground">
        Research study
      </h2>
      {body()}
      {participant && submission ? (
        <div aria-live="polite" className="mt-3 flex items-center gap-3 text-[13px] text-foreground">
          {save.isPending ? <span>Saving this attempt…</span> : null}
          {save.isSuccess ? <span>Saved to your record.</span> : null}
          {save.isError ? (
            <>
              <span>Couldn&apos;t save this attempt.</span>
              <button type="button" className={button} onClick={() => mutate(submission)}>
                Try again
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
