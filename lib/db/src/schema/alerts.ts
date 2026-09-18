import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("draft"),
  location: text("location").notNull(),
  affectedAreas: text("affected_areas").array().notNull(),
  instructions: text("instructions").array().notNull(),
  channels: text("channels").array().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  source: text("source").notNull(),
  audience: integer("audience").notNull().default(0),
  delivered: integer("delivered").notNull().default(0),
  acknowledged: integer("acknowledged").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  channelDelivery: jsonb("channel_delivery").$type<
    Array<{
      channel: string;
      delivered: number;
      total: number;
      status: "sent" | "sending" | "queued" | "unavailable";
    }>
  >().notNull().default([]),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({
  createdAt: true,
  publishedAt: true,
  status: true,
  audience: true,
  delivered: true,
  acknowledged: true,
  failed: true,
  channelDelivery: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;