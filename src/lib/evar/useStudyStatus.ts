"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { participantResponseSchema, type Participant } from "./research";

/**
 * Where someone stands with the study: signed in or not, and joined or not.
 * The welcome page asks the question and the practice shows the Admin link
 * from it. The queries are the study panel's too, so react-query shares the
 * answers.
 */
export function useStudyStatus() {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<{ sub: string | null; email: string | null; isFlagAdmin?: boolean }> =>
      fetch("/api/me").then((r) => (r.ok ? r.json() : { sub: null, email: null })),
    staleTime: 5 * 60_000,
  });
  const signedIn = Boolean(me.data?.sub);
  const participant = useQuery({
    queryKey: queryKeys.evar.participant(),
    queryFn: async () => {
      const res = await fetch("/api/evar/participant");
      if (!res.ok) throw new Error(`GET /api/evar/participant failed with ${res.status}`);
      return participantResponseSchema.parse(await res.json()).participant;
    },
    enabled: signedIn,
  });

  return {
    signedIn,
    // The same allowlist the admin pages check. A hint for showing a link, not the gate:
    // the pages and their API routes check again on every request.
    isAdmin: me.data?.isFlagAdmin === true,
    joined: Boolean(participant.data),
    /** Whether the answers are in, so nothing asks before it knows. */
    known: !me.isPending && (!signedIn || !participant.isPending),
    unreachable: participant.isError,
    joinedAs: (joined: Participant) => queryClient.setQueryData(queryKeys.evar.participant(), joined),
  };
}
