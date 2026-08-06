import { z } from "zod";

export const safeText = z.string().trim().min(1).max(4_000);
export const featureKeySchema = z.string().regex(/^[a-z0-9_]{2,50}$/);
export const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9:_-]{12,160}$/);

export const diagnosticInputSchema = z.object({ message: z.string().trim().min(1).max(200) });
export const diagnosticOutputSchema = z.object({ acknowledgement: z.string().max(240), ready: z.boolean() });
