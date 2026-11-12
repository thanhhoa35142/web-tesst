"use client";

import { useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import { useAdminQuery } from "@/features/admin/use-admin-query";
import { apiGet } from "@/features/admin/api";
import { apiKeysSchema, type ApiKey } from "@/features/admin/schemas";
import { PageHeader } from "@/features/admin/components/page-header";
import { QueryState } from "@/features/admin/components/query-state";
import { CreateKeyDialog } from "@/features/admin/components/api-keys/create-key-dialog";
import { RevokeKeyDialog } from "@/features/admin/components/api-keys/revoke-key-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "cn";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function keyStatus(k: ApiKey, now: number): "active" | "expired" | "revoked" {
  if (k.revokedAt) return "revoked";
  if (k.expiresAt && new Date(k.expiresAt).getTime() < now) return "expired";
  return "active";
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-foreground text-background hover:bg-foreground",
  expired: "bg-secondary text-secondary-foreground hover:bg-secondary",
  revoked: "bg-muted text-muted-foreground line-through hover:bg-muted",
};

export default function ApiKeysPage() {
  const { data, error, loading, refetch } = useAdminQuery("api-keys", () =>
    apiGet("/v1/admin/api-keys", apiKeysSchema),
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  // Snapshot of "now" per mount — expiry badges don't need live ticking.
  const [now] = useState(() => Date.now());
  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="API Keys"
        description="Scoped credentials for MCP servers and integrations. Secrets are shown once at creation and stored only as hashes."
      />
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Keys</CardTitle>
            <CardDescription>
              Grants use resource:action pairs with deny-wins evaluation.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Create key
          </Button>
        </CardHeader>
        <CardContent>
          <QueryState loading={loading} error={error}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Grants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((k) => {
                  const status = keyStatus(k, now);
                  const expiredSoon =
                    k.expiresAt &&
                    status === "active" &&
                    new Date(k.expiresAt).getTime() - now <
                      5 * 86400_000;
                  return (
                    <TableRow key={k.id} className={status === "revoked" ? "opacity-60" : ""}>
                      <TableCell>
                        <div className="font-medium">{k.name}</div>
                        {k.description && (
                          <div className="max-w-56 truncate text-xs text-muted-foreground">
                            {k.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{k.keyPrefix}…</TableCell>
                      <TableCell>
                        <div className="flex max-w-64 flex-wrap gap-1">
                          {k.grants.map((g) => (
                            <Badge
                              key={`${g.effect}:${g.resource}:${g.action}`}
                              variant="secondary"
                              className={cn(
                                "font-mono text-[10px]",
                                g.effect === "deny" &&
                                  "bg-destructive/10 text-destructive line-through",
                              )}
                            >
                              {g.effect} {g.resource}:{g.action}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("font-mono text-xs", STATUS_STYLE[status])}
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {timeAgo(k.lastUsedAt)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {k.expiresAt ? (
                          <span className={expiredSoon ? "text-amber-600" : ""}>
                            {new Date(k.expiresAt).toLocaleDateString()}
                            {expiredSoon ? " (soon)" : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {status === "active" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setRevokeTarget(k)}
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      <KeyRound className="mx-auto mb-2 size-6 opacity-40" />
                      No API keys yet. Create one to connect an MCP client.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </QueryState>
        </CardContent>
      </Card>

      <CreateKeyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refetch}
      />
      <RevokeKeyDialog
        apiKey={revokeTarget}
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        onRevoked={refetch}
      />
    </div>
  );
}
