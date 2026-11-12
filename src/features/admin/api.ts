"use client";

import type { z } from "zod";
import { envelope, problemSchema, type Problem } from "./schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const TOKEN_KEY = "pickhour_admin_token";
const SESSION_COOKIE = "ph_admin_session";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  // Flag cookie for middleware route guarding (not the token itself).
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=604800; samesite=lax`;
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

export class ApiError extends Error {
  code?: string;
  status: number;
  requestId?: string;

  constructor(problem: Problem, status: number) {
    super(problem.detail ?? problem.title ?? `HTTP ${status}`);
    this.name = "ApiError";
    this.code = problem.code;
    this.status = status;
    this.requestId = problem.requestId;
  }
}

function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    // Hard reload so middleware re-checks the (now cleared) session cookie.
    window.location.reload();
  }
}

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    clearToken();
    redirectToLogin();
    throw new ApiError({ code: "unauthorized", title: "Unauthorized" }, res.status);
  }

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const problem = problemSchema.safeParse(json);
    throw new ApiError(
      problem.success ? problem.data : { title: `HTTP ${res.status}` },
      res.status,
    );
  }

  const parsed = envelope(schema).safeParse(json);
  if (!parsed.success) {
    throw new ApiError(
      { code: "bad_response", title: "Unexpected response shape" },
      res.status,
    );
  }
  return parsed.data.data;
}

export function apiGet<T>(path: string, schema: z.ZodType<T>) {
  return request("GET", path, undefined, schema);
}

export function apiSend<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
) {
  return request(method, path, body, schema);
}
