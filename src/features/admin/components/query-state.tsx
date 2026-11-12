"use client";

import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { ApiError } from "../api";
import { Skeleton } from "@/components/ui/skeleton";

export function QueryState({
  loading,
  error,
  children,
  skeleton,
}: {
  loading: boolean;
  error: Error | undefined;
  children: ReactNode;
  skeleton?: ReactNode;
}) {
  if (loading) {
    return (
      <>
        {skeleton ?? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        )}
      </>
    );
  }
  if (error) {
    const apiErr = error instanceof ApiError ? error : undefined;
    return (
      <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div>
          <p className="font-medium text-destructive">
            {apiErr?.code ?? "Request failed"}
          </p>
          <p className="mt-0.5 text-muted-foreground">{error.message}</p>
          {apiErr?.requestId && (
            <p className="mt-1 text-xs text-muted-foreground">
              request id:{" "}
              <span className="font-mono">{apiErr.requestId}</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
