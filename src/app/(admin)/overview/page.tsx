"use client";

import { useAdminQuery } from "@/features/admin/use-admin-query";
import { apiGet } from "@/features/admin/api";
import {
  freshnessSchema,
  metricsSchema,
  overviewSchema,
  type Metrics,
} from "@/features/admin/schemas";
import { PageHeader } from "@/features/admin/components/page-header";
import { QueryState } from "@/features/admin/components/query-state";
import { StatCard } from "@/features/admin/components/stat-card";
import { ScoreHistogram } from "@/features/admin/components/score-histogram";
import { StatusBadge } from "@/features/admin/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function ago(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function FreshnessRow({ label, ts }: { label: string; ts: string | null }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="font-mono text-xs">
        {ts ? new Date(ts).toISOString() : "—"}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {ago(ts)}
      </TableCell>
    </TableRow>
  );
}

function MetricsPanel({ metrics }: { metrics: Metrics }) {
  const capRate =
    metrics.score.totalRows > 0
      ? ((metrics.score.cappedRows / metrics.score.totalRows) * 100).toFixed(1)
      : "0";
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score distribution</CardTitle>
          <CardDescription>
            {metrics.score.totalRows} rows, avg{" "}
            {metrics.score.avgScore.toFixed(1)}, {capRate}% capped
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScoreHistogram histogram={metrics.score.histogram} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crowd source mix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(
            [
              ["model", metrics.crowd.model],
              ["community", metrics.crowd.community],
              ["provider", metrics.crowd.provider],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-mono tabular-nums">{v}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {metrics.feedback.length === 0 && (
            <p className="text-muted-foreground">No feedback yet.</p>
          )}
          {metrics.feedback.map((f) => (
            <div key={f.verdict} className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono">
                verdict {f.verdict > 0 ? "+" : ""}
                {f.verdict}
              </Badge>
              <span className="font-mono tabular-nums">{f.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {metrics.subscriptions.length === 0 && (
            <p className="text-muted-foreground">No subscriptions.</p>
          )}
          {metrics.subscriptions.map((s) => (
            <div key={s.status} className="flex items-center justify-between">
              <span className="text-muted-foreground">{s.status}</span>
              <span className="font-mono tabular-nums">{s.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Reports by type / status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.reports.map((r) => (
                <TableRow key={`${r.type}-${r.status}`}>
                  <TableCell className="font-mono text-xs">{r.type}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {r.count}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OverviewPage() {
  const overview = useAdminQuery("overview", () =>
    apiGet("/v1/admin/overview", overviewSchema),
  );
  const freshness = useAdminQuery("freshness", () =>
    apiGet("/v1/admin/freshness", freshnessSchema),
  );
  const metrics = useAdminQuery("metrics", () =>
    apiGet("/v1/admin/metrics?days=7", metricsSchema),
  );

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="Overview"
        description="Pipeline health and headline counts."
      />

      <QueryState loading={overview.loading} error={overview.error}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Active spots" value={overview.data?.activeSpots ?? "—"} />
          <StatCard
            label="Fresh scores"
            value={overview.data?.spotsWithFreshScore ?? "—"}
            hint="spots scored in last 2h"
          />
          <StatCard
            label="Devices"
            value={overview.data?.devices ?? "—"}
            hint={`${overview.data?.devicesActive24h ?? 0} active 24h`}
          />
          <StatCard
            label="Plus devices"
            value={overview.data?.plusDevices ?? "—"}
          />
          <StatCard
            label="Pending reports"
            value={overview.data?.pendingReports ?? "—"}
            hint={`${overview.data?.reports24h ?? 0} reports / 24h`}
          />
          <StatCard
            label="Crowd reports 24h"
            value={overview.data?.crowdReports24h ?? "—"}
          />
          <StatCard
            label="Alert rules"
            value={overview.data?.enabledAlertRules ?? "—"}
          />
          <StatCard
            label="Deliveries 24h"
            value={overview.data?.alertDeliveries24h ?? "—"}
          />
        </div>
      </QueryState>

      <div className="mt-6">
        <QueryState loading={freshness.loading} error={freshness.error}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data freshness</CardTitle>
              <CardDescription>
                Newest timestamp per pipeline stage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage</TableHead>
                    <TableHead>Latest (UTC)</TableHead>
                    <TableHead className="text-right">Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <FreshnessRow
                    label="Weather fetch"
                    ts={freshness.data?.weatherFetchedAt ?? null}
                  />
                  <FreshnessRow
                    label="Score compute"
                    ts={freshness.data?.scoreComputedAt ?? null}
                  />
                  <FreshnessRow
                    label="Crowd update"
                    ts={freshness.data?.crowdUpdatedAt ?? null}
                  />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </QueryState>
      </div>

      <div className="mt-6">
        <PageHeader title="Metrics" description="Last 7 days." />
        <QueryState loading={metrics.loading} error={metrics.error}>
          {metrics.data && <MetricsPanel metrics={metrics.data} />}
        </QueryState>
      </div>
    </div>
  );
}
