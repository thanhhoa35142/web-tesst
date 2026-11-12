"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useAdminQuery } from "@/features/admin/use-admin-query";
import { apiGet, apiSend } from "@/features/admin/api";
import {
  scoringConfigsSchema,
  type ScoringConfig,
} from "@/features/admin/schemas";
import { PageHeader } from "@/features/admin/components/page-header";
import { QueryState } from "@/features/admin/components/query-state";
import { StatusBadge } from "@/features/admin/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const versionSchema = z.object({ version: z.number() });

function ConfigDetail({ cfg }: { cfg: ScoringConfig }) {
  return (
    <details className="group">
      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
        weights / thresholds
      </summary>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        {(
          [
            ["Weights", cfg.weights],
            ["Thresholds", cfg.thresholds],
          ] as const
        ).map(([label, obj]) => (
          <div key={label}>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {label}
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
              {JSON.stringify(obj, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function ScoringPage() {
  const { data, error, loading, refetch } = useAdminQuery("scoring", () =>
    apiGet("/v1/admin/scoring-config", scoringConfigsSchema),
  );
  const [busy, setBusy] = useState<number | null>(null);

  async function activate(version: number) {
    setBusy(version);
    try {
      await apiSend(
        "POST",
        `/v1/admin/scoring-config/${version}/activate`,
        versionSchema,
      );
      toast.success(`v${version} activated`);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="Scoring config"
        description="Versioned weights and thresholds. Activating a version applies it to the next recompute."
      />
      <QueryState loading={loading} error={error}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Versions</CardTitle>
            <CardDescription>
              Drafts have a far-future activeFrom; only one version is live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active from</TableHead>
                  <TableHead>Config</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).map((c) => (
                  <TableRow key={c.version}>
                    <TableCell className="font-mono font-medium">
                      v{c.version}
                    </TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <StatusBadge status="accepted" />
                      ) : (
                        <StatusBadge status="pending" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {new Date(c.activeFrom).toISOString().slice(0, 10)}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <ConfigDetail cfg={c} />
                    </TableCell>
                    <TableCell className="text-right">
                      {!c.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === c.version}
                          onClick={() => activate(c.version)}
                        >
                          Activate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.items ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No configs.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </QueryState>
    </div>
  );
}
