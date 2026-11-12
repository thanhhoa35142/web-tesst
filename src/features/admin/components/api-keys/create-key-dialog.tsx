"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Plus, X } from "lucide-react";
import { apiSend } from "@/features/admin/api";
import {
  createdApiKeySchema,
  type ApiKeyGrant,
  type CreatedApiKey,
} from "@/features/admin/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Compact, bounded selects — grant editor stays small per UI rules.
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

type Step = "form" | "reveal";

export function CreateKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expiresDays, setExpiresDays] = useState("");
  const [resource, setResource] = useState(RESOURCES[0]);
  const [action, setAction] = useState(ACTIONS[0]);
  const [grants, setGrants] = useState<ApiKeyGrant[]>([]);
  const [issued, setIssued] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep("form");
    setName("");
    setDescription("");
    setExpiresDays("");
    setResource(RESOURCES[0]);
    setAction(ACTIONS[0]);
    setGrants([]);
    setIssued(null);
    setCopied(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function addGrant() {
    const g: ApiKeyGrant = { effect: "allow", resource, action };
    if (grants.some((x) => x.resource === g.resource && x.action === g.action)) {
      return;
    }
    setGrants((prev) => [...prev, g]);
  }

  function removeGrant(i: number) {
    setGrants((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!name.trim() || grants.length === 0) return;
    setBusy(true);
    try {
      const days = parseInt(expiresDays, 10);
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        grants: grants.map(({ effect, resource, action }) => ({
          effect,
          resource,
          action,
        })),
      };
      if (Number.isFinite(days) && days > 0) {
        body.expiresAt = new Date(Date.now() + days * 86400_000).toISOString();
      }
      const created = await apiSend("POST", "/v1/admin/api-keys", createdApiKeySchema, body);
      setIssued(created);
      setStep("reveal");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setBusy(false);
    }
  }

  async function copySecret() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.secret);
      setCopied(true);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed — select the key manually");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                Scoped credentials for MCP servers and integrations. The secret
                is shown once after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ops-agent"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="key-desc">Description</Label>
                <Input
                  id="key-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this key for?"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Grants</Label>
                <div className="flex flex-wrap items-center gap-2">
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
                    <SelectTrigger size="sm" className="w-28">
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
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addGrant}
                    disabled={grants.some(
                      (g) => g.resource === resource && g.action === action,
                    )}
                  >
                    <Plus className="size-4" /> Add
                  </Button>
                </div>
                {grants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {grants.map((g, i) => (
                      <span
                        key={`${g.resource}:${g.action}`}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-xs"
                      >
                        allow {g.resource}:{g.action}
                        <button
                          type="button"
                          onClick={() => removeGrant(i)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remove ${g.resource}:${g.action}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {grants.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    At least one grant is required.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="key-expiry">Expires in days (optional)</Label>
                <Input
                  id="key-expiry"
                  type="number"
                  min={1}
                  value={expiresDays}
                  onChange={(e) => setExpiresDays(e.target.value)}
                  placeholder="Never"
                  className="w-32"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={busy || !name.trim() || grants.length === 0}
              >
                {busy ? "Creating…" : "Create key"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Copy your API key</DialogTitle>
              <DialogDescription>
                This secret is shown <strong>once</strong> and cannot be
                recovered. Store it in a secrets manager now.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  readOnly
                  value={issued?.secret ?? ""}
                  className="min-w-48 flex-1 font-mono text-xs"
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copySecret}
                  aria-label="Copy secret"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                If you lose it, revoke this key and create a new one.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
