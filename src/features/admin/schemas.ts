import { z } from "zod";

// All admin endpoints wrap payloads in { "data": ... }.
export const envelope = <T extends z.ZodType>(schema: T) =>
  z.object({ data: schema });

export const overviewSchema = z.object({
  activeSpots: z.number(),
  spotsWithFreshScore: z.number(),
  devices: z.number(),
  devicesActive24h: z.number(),
  pendingReports: z.number(),
  reports24h: z.number(),
  crowdReports24h: z.number(),
  enabledAlertRules: z.number(),
  alertDeliveries24h: z.number(),
  plusDevices: z.number(),
});
export type Overview = z.infer<typeof overviewSchema>;

export const freshnessSchema = z.object({
  weatherFetchedAt: z.string().nullable(),
  scoreComputedAt: z.string().nullable(),
  crowdUpdatedAt: z.string().nullable(),
});
export type Freshness = z.infer<typeof freshnessSchema>;

export const jobRunSchema = z.object({
  id: z.number(),
  job: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  status: z.string(),
  rowsAffected: z.number().nullable(),
  error: z.string().nullable(),
});
export type JobRun = z.infer<typeof jobRunSchema>;
export const jobsSchema = z.object({
  items: z.array(jobRunSchema),
  nextCursor: z.string().nullable(),
});
export type JobsResponse = z.infer<typeof jobsSchema>;

export const jobScheduleSchema = z.object({
  job: z.string(),
  intervalSeconds: z.number(),
  minIntervalSeconds: z.number(),
  maxIntervalSeconds: z.number(),
  updatedAt: z.string(),
});
export const jobSchedulesSchema = z.object({
  items: z.array(jobScheduleSchema),
});
export type JobSchedule = z.infer<typeof jobScheduleSchema>;
export type JobSchedulesResponse = z.infer<typeof jobSchedulesSchema>;

export const reportSchema = z.object({
  id: z.string(),
  spotId: z.string(),
  spotName: z.string(),
  type: z.string(),
  issueCode: z.string().nullable(),
  createdAt: z.string(),
});
export type Report = z.infer<typeof reportSchema>;
export const reportsSchema = z.object({
  items: z.array(reportSchema),
  nextCursor: z.string().nullable(),
});
export type ReportsResponse = z.infer<typeof reportsSchema>;

export const metricsSchema = z.object({
  score: z.object({
    totalRows: z.number(),
    avgScore: z.number(),
    cappedRows: z.number(),
    spots: z.number(),
    histogram: z.array(z.number()),
  }),
  feedback: z.array(z.object({ verdict: z.number(), count: z.number() })),
  reports: z.array(
    z.object({ type: z.string(), status: z.string(), count: z.number() }),
  ),
  crowd: z.object({
    model: z.number(),
    community: z.number(),
    provider: z.number(),
  }),
  subscriptions: z.array(
    z.object({ status: z.string(), count: z.number() }),
  ),
  deliveries: z.array(
    z.object({ apnsStatus: z.number(), count: z.number() }),
  ),
});
export type Metrics = z.infer<typeof metricsSchema>;

export const eventSummarySchema = z.object({
  from: z.string(),
  to: z.string(),
  byName: z.array(z.object({ name: z.string(), count: z.number() })),
  byDay: z.array(z.object({ day: z.string(), count: z.number() })),
});
export type EventSummary = z.infer<typeof eventSummarySchema>;

export const scoringConfigSchema = z.object({
  version: z.number(),
  weights: z.record(z.string(), z.number()),
  thresholds: z.record(z.string(), z.number()),
  activeFrom: z.string(),
  isActive: z.boolean(),
});
export type ScoringConfig = z.infer<typeof scoringConfigSchema>;
export const scoringConfigsSchema = z.object({
  items: z.array(scoringConfigSchema),
});
export type ScoringConfigsResponse = z.infer<typeof scoringConfigsSchema>;

// --- API keys (MCP/agent credentials) ---

export const apiKeyGrantSchema = z.object({
  effect: z.string(),
  resource: z.string(),
  action: z.string(),
  createdAt: z.string().optional(),
});
export type ApiKeyGrant = z.infer<typeof apiKeyGrantSchema>;

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  keyPrefix: z.string(),
  rateLimitRps: z.number(),
  expiresAt: z.string().nullable(),
  lastUsedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
  createdAt: z.string(),
  grants: z.array(apiKeyGrantSchema),
});
export type ApiKey = z.infer<typeof apiKeySchema>;
export const apiKeysSchema = z.object({ items: z.array(apiKeySchema) });
export type ApiKeysResponse = z.infer<typeof apiKeysSchema>;

// Create response carries the raw secret — returned exactly once.
export const createdApiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  keyPrefix: z.string(),
  rateLimitRps: z.number(),
  expiresAt: z.string().nullable(),
  lastUsedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
  createdAt: z.string(),
  secret: z.string(),
});
export type CreatedApiKey = z.infer<typeof createdApiKeySchema>;

export const grantAckSchema = z.object({ status: z.string() });

// RFC 7807 problem+json extended with `code` and `requestId`.
export const problemSchema = z.object({
  type: z.string().optional(),
  code: z.string().optional(),
  title: z.string().optional(),
  status: z.number().optional(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  requestId: z.string().optional(),
});
export type Problem = z.infer<typeof problemSchema>;
