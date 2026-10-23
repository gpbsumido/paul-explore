"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { studyExportSchema } from "@/lib/evar/studyExport";

/** The whole study export, shared by the admin page's download card and the results page. */
export function useStudyExport() {
  return useQuery({
    queryKey: queryKeys.evar.studyExport(),
    queryFn: async () => {
      const res = await fetch("/api/evar/admin/export");
      if (!res.ok) throw new Error(`GET /api/evar/admin/export failed with ${res.status}`);
      return studyExportSchema.parse(await res.json());
    },
  });
}
