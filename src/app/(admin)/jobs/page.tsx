"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAdminQuery } from "@/features/admin/use-admin-query";
import { apiGet, apiSend } from "@/features/admin/api";
import {
  jobScheduleSchema,
  jobSchedulesSchema,
  jobsSchema,
  type JobSchedule,
} from "@/features/admin/schemas";
import { PageHeader } from "@/features/admin/components/page-header";
import { QueryState } from "@/features/admin/components/query-state";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatInterval(seconds: number) {
  if (seconds % 86400 === 0) return `${seconds / 86400} days`;
  if (seconds % 3600 === 0) return `${seconds / 3600} hours`;
  return `${seconds / 60} minutes`;
}

function JobScheduleRow({
  schedule,
  refetch,
}: {
  schedule: JobSchedule;
  refetch: () => void;
}) {
  const [minutes, setMinutes] = useState(String(schedule.intervalSeconds / 60));
  const [busy, setBusy] = useState(false);
  const intervalMinutes = Number(minutes);
  const minMinutes = Math.ceil(schedule.minIntervalSeconds / 60);
  const maxMinutes = Math.floor(schedule.maxIntervalSeconds / 60);
  const valid =
    Number.isInteger(intervalMinutes) &&
    intervalMinutes >= minMinutes &&
    intervalMinutes <= maxMinutes;
  const changed = valid && intervalMinutes * 60 !== schedule.intervalSeconds;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || !changed) return;

    setBusy(true);
    try {
      await apiSend(
        "PATCH",
        `/v1/admin/jobs/${encodeURIComponent(schedule.job)}/schedule`,
        jobScheduleSchema,
        { intervalSeconds: intervalMinutes * 60 },
      );
      toast.success(`${schedule.job} interval updated`);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update interval");
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{schedule.job}</TableCell>
      <TableCell>
        <form className="flex max-w-56 items-center gap-2" onSubmit={save}>
          <label className="sr-only" htmlFor={`interval-${schedule.job}`}>
            Interval in minutes for {schedule.job}
          </label>
          <Input
            id={`interval-${schedule.job}`}
            type="number"
            min={minMinutes}
            max={maxMinutes}
            step={1}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            aria-invalid={!valid}
          />
          <Button size="sm" variant="outline" type="submit" disabled={busy || !changed}>
            Save
          </Button>
        </form>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatInterval(schedule.minIntervalSeconds)}–{formatInterval(schedule.maxIntervalSeconds)}
      </TableCell>
    </TableRow>
  );
}

export default function JobsPage() {
  const {
    data: jobsData,
    error: jobsError,
    loading: jobsLoading,
  } = useAdminQuery("jobs", () =>
    apiGet("/v1/admin/jobs?limit=100", jobsSchema),
  );
  const {
    data: schedulesData,
    error: schedulesError,
    loading: schedulesLoading,
    refetch: refetchSchedules,
  } = useAdminQuery("job-schedules", () =>
    apiGet("/v1/admin/jobs/schedules", jobSchedulesSchema),
  );

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="Jobs"
        description="Configure background job intervals and review recent runs."
      />
      <QueryState loading={schedulesLoading} error={schedulesError}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Job intervals</CardTitle>
            <CardDescription>
              Changes are picked up by running workers within 30 seconds. Intervals are in minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Interval (minutes)</TableHead>
                  <TableHead>Allowed range</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(schedulesData?.items ?? []).map((schedule) => (
                  <JobScheduleRow
                    key={schedule.job}
                    schedule={schedule}
                    refetch={refetchSchedules}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </QueryState>
      <QueryState loading={jobsLoading} error={jobsError}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job runs</CardTitle>
            <CardDescription>Latest 100 runs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(jobsData?.items ?? []).map((j) => {
                  const duration =
                    j.finishedAt && j.startedAt
                      ? `${((new Date(j.finishedAt).getTime() - new Date(j.startedAt).getTime()) / 1000).toFixed(1)}s`
                      : "—";
                  return (
                    <TableRow key={j.id}>
                      <TableCell className="font-mono text-xs">{j.job}</TableCell>
                      <TableCell>
                        <StatusBadge status={j.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {new Date(j.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{duration}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {j.rowsAffected ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-64 truncate text-xs text-muted-foreground">
                        {j.error ?? ""}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(jobsData?.items ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No job runs yet.
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
