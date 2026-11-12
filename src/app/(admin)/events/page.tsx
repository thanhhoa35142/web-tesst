"use client";

import { useState } from "react";
import { apiGet } from "@/features/admin/api";
import { eventSummarySchema } from "@/features/admin/schemas";
import { useAdminQuery } from "@/features/admin/use-admin-query";
import { EventsByDay } from "@/features/admin/components/events-by-day";
import { PageHeader } from "@/features/admin/components/page-header";
import { QueryState } from "@/features/admin/components/query-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function toRFC3339(date: string, endOfDay = false): string | undefined {
  if (!date) return undefined;
  const d = new Date(`${date}T${endOfDay ? "23:59:59" : "00:00:00"}Z`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export default function EventsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [name, setName] = useState("");
  const [applied, setApplied] = useState({ from: "", to: "", name: "" });

  const params = new URLSearchParams();
  const fromTs = toRFC3339(applied.from);
  const toTs = toRFC3339(applied.to, true);
  if (fromTs) params.set("from", fromTs);
  if (toTs) params.set("to", toTs);
  if (applied.name.trim()) params.set("name", applied.name.trim());
  if (!params.has("from") && !params.has("to") && !params.has("name")) {
    params.set("days", "30");
  }
  const queryKey = `/v1/admin/events?${params.toString()}`;

  const { data, error, loading } = useAdminQuery(queryKey, () =>
    apiGet(queryKey, eventSummarySchema),
  );

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="Events"
        description="Product analytics events by name and UTC day."
      />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <Label htmlFor="from" className="text-xs">From (UTC)</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-xs">To (UTC)</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs">Event name</Label>
            <Input
              id="name"
              placeholder="paywall_view"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-48 font-mono text-xs"
            />
          </div>
          <Button
            size="sm"
            onClick={() => setApplied({ from, to, name })}
          >
            Apply
          </Button>
          {(from || to || name) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFrom("");
                setTo("");
                setName("");
                setApplied({ from: "", to: "", name: "" });
              }}
            >
              Reset
            </Button>
          )}
        </CardContent>
      </Card>

      <QueryState loading={loading} error={error}>
        {data && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Events per day</CardTitle>
                <CardDescription>
                  {new Date(data.from).toLocaleDateString()} to{" "}
                  {new Date(data.to).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventsByDay data={data.byDay} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">By event name</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byName.map((n) => (
                      <TableRow key={n.name}>
                        <TableCell className="font-mono text-xs">{n.name}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {n.count}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.byName.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No events in range.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </QueryState>
    </div>
  );
}
