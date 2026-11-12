"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiSend } from "@/features/admin/api";
import { grantAckSchema, type ApiKey } from "@/features/admin/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RevokeKeyDialog({
  apiKey,
  open,
  onOpenChange,
  onRevoked,
}: {
  apiKey: ApiKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRevoked: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function revoke() {
    if (!apiKey) return;
    setBusy(true);
    try {
      await apiSend(
        "POST",
        `/v1/admin/api-keys/${apiKey.id}/revoke`,
        grantAckSchema,
        {},
      );
      toast.success(`Key ${apiKey.keyPrefix}… revoked`);
      onRevoked();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke API key</DialogTitle>
          <DialogDescription>
            Applications using{" "}
            <span className="font-mono font-medium">{apiKey?.name}</span>{" "}
            (<span className="font-mono">{apiKey?.keyPrefix}…</span>) will stop
            working immediately. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={revoke} disabled={busy}>
            {busy ? "Revoking…" : "Revoke key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
