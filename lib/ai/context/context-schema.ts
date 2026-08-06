import { z } from "zod";

export const businessContextSchema = z.object({
  businessId: z.string().uuid(), name: z.string().max(160), industry: z.string().max(160),
  description: z.string().max(2_000), location: z.string().max(240), audience: z.string().max(1_000),
  tone: z.string().max(80), languages: z.array(z.string().max(40)).max(8),
  platforms: z.array(z.string().max(40)).max(10), goals: z.array(z.string().max(80)).max(12),
  postsPerWeek: z.number().int().min(1).max(14),
});
