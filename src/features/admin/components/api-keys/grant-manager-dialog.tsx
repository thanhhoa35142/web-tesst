"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { apiSend } from "@/features/admin/api";
import { grantAckSchema, type ApiKey } from "@/features/admin/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "cn";

const RESOURCES = [
  "spots",
  "recommendations",
  "scores",
  "alerts",
  "reports",
  "devices",
  "entitlement",
  "events",
  "admin",
  "*",
];
const ACTIONS = ["read", "write", "*"];
const EFFECTS = ["allow", "deny"];

export function GrantManagerDialog({
  apiKey,
  open,
  onOpenChange,
  onChanged,
}: {
  apiKey: ApiKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [effect, setEffect] = useState("allow");
  const [resource, setResource] = useState(RESOURCES[0]);
  const [action, setAction] = useState(ACTIONS[0]);
  const [busy, setBusy] = useState(false);

  if (!apiKey) return null;

  const grantBody = (g: { effect: string; resource: string; action: string }) => ({
    effect: g.effect,
    resource: g.resource,
    action: g.action,
  });

  async function add() {
    if (!apiKey) return;
    setBusy(true);
    try {
      await apiSend(
        "POST",
        `/v1/admin/api-keys/${apiKey.id}/grants`,
        grantAckSchema,
        grantBody({ effect, resource, action }),
      );
      toast.success(`Grant ${effect} ${resource}:${action} added`);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add grant");
    } finally {
      setBusy(false);
    }
  }

  async function remove(g: { effect: string; resource: string; action: string }) {
    if (!apiKey) return;
    setBusy(true);
    try {
      await apiSend(
        "DELETE",
        `/v1/admin/api-keys/${apiKey.id}/grants`,
        grantAckSchema,
        grantBody(g),
      );
      toast.success(`Grant ${g.effect} ${g.resource}:${g.action} removed`);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove grant");
    } finally {
      setBusy(false);
    }
  }

  const exists = apiKey.grants.some(
    (g) => g.effect === effect && g.resource === resource && g.action === action,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grants — {apiKey.name}</DialogTitle>
          <DialogDescription>
            allow/deny rules over resource:action pairs. Deny wins over allow.
            Changes take effect on the next request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            {apiKey.grants.length === 0 && (
              <p className="text-sm text-muted-foreground">No grants — this key can do nothing.</p>
            )}
            {apiKey.grants.map((g) => (
              <div
                key={`${g.effect}:${g.resource}:${g.action}`}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-mono text-xs",
                    g.effect === "deny" &&
                      "bg-destructive/10 text-destructive line-through",
                  )}
                >
                  {g.effect} {g.resource}:{g.action}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  disabled={busy}
                  onClick={() => remove(g)}
                  aria-label={`Remove ${g.effect} ${g.resource}:${g.action}`}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">Add grant</p>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={effect} onValueChange={(v) => setEffect(v as string)}>
                <SelectTrigger size="sm" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EFFECTS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={resource} onValueChange={(v) => setResource(v as string)}>
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={action} onValueChange={(v) => setAction(v as string)}>
                <SelectTrigger size="sm" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={add}
                disabled={busy || exists}
              >
                <Plus className="size-4" /> Add
              </Button>
            </div>
            {exists && (
              <p className="text-xs text-muted-foreground">
                This grant already exists.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
