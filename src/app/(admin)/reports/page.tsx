"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdminQuery } from "@/features/admin/use-admin-query";
import { apiGet, apiSend } from "@/features/admin/api";
import { z } from "zod";
import { reportsSchema, type Report } from "@/features/admin/schemas";
import { PageHeader } from "@/features/admin/components/page-header";
import { QueryState } from "@/features/admin/components/query-state";
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

const moderateSchema = z.object({ status: z.string() });

export default function ReportsPage() {
  const { data, error, loading, refetch } = useAdminQuery("reports", () =>
    apiGet("/v1/admin/reports?limit=50", reportsSchema),
  );
  const [extraItems, setExtraItems] = useState<Report[]>([]);
  const [cursor, setCursor] = useState<string | null>();
  const [loadingMore, setLoadingMore] = useState(false);
  const items = [...(data?.items ?? []), ...extraItems];
  const nextCursor = cursor === undefined ? (data?.nextCursor ?? null) : cursor;

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await apiGet(
        `/v1/admin/reports?limit=50&cursor=${encodeURIComponent(nextCursor)}`,
        reportsSchema,
      );
      setExtraItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }
  const [busyId, setBusyId] = useState<string | null>(null);

  async function moderate(id: string, status: "accepted" | "rejected") {
    setBusyId(id);
    try {
      await apiSend("PATCH", `/v1/admin/reports/${id}`, moderateSchema, {
        status,
      });
      toast.success(`Report ${status}`);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="Reports"
        description="Moderation queue for user-submitted spot reports."
      />
      <QueryState loading={loading} error={error}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending reports</CardTitle>
            <CardDescription>Latest 100.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spot</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.spotName}</TableCell>
                    <TableCell className="font-mono text-xs">{r.type}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.issueCode ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === r.id}
                          onClick={() => moderate(r.id, "accepted")}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === r.id}
                          onClick={() => moderate(r.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Queue is empty.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {nextCursor && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingMore}
                  onClick={loadMore}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </QueryState>
    </div>
  );
}
