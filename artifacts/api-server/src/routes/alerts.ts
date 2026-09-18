import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, alertsTable, type Alert as DbAlert } from "@workspace/db";
import {
  CreateAlertBody,
  CreateAlertResponse,
  GetAlertDeliveryParams,
  GetAlertDeliveryResponse,
  GetAlertParams,
  GetAlertResponse,
  GetDashboardSummaryResponse,
  ListAlertsQueryParams,
  ListAlertsResponse,
  PublishAlertParams,
  PublishAlertResponse,
  UpdateAlertBody,
  UpdateAlertParams,
  UpdateAlertResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const channels = ["sms", "push", "web", "siren", "radio"] as const;

function deliveryFor(alert: DbAlert) {
  return {
    audience: alert.audience,
    delivered: alert.delivered,
    acknowledged: alert.acknowledged,
    failed: alert.failed,
    lastUpdated: alert.publishedAt ?? alert.createdAt,
    channels: alert.channelDelivery,
  };
}

function toApiAlert(alert: DbAlert) {
  return {
    id: alert.id,
    title: alert.title,
    message: alert.message,
    type: alert.type,
    severity: alert.severity,
    status: alert.status,
    location: alert.location,
    affectedAreas: alert.affectedAreas,
    instructions: alert.instructions,
    channels: alert.channels,
    createdAt: alert.createdAt,
    publishedAt: alert.publishedAt,
    expiresAt: alert.expiresAt,
    source: alert.source,
    delivery: deliveryFor(alert),
  };
}

async function ensureSeeded() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(alertsTable);
  if (Number(count) > 0) return;

  const now = Date.now();
  await db.insert(alertsTable).values([
    {
      id: "AL-2026-0918-01",
      title: "River level rising rapidly",
      message:
        "Water levels on the Mula-Mutha river are rising rapidly. Residents in low-lying areas should move to designated shelters now.",
      type: "flood",
      severity: "critical",
      status: "active",
      location: "Pune district",
      affectedAreas: ["Kharadi", "Mundhwa", "Yerawada", "Vishrantwadi"],
      instructions: [
        "Move to higher ground immediately",
        "Carry essential medicines and documents",
        "Do not walk or drive through moving water",
      ],
      channels: ["sms", "push", "web", "siren"],
      publishedAt: new Date(now - 1000 * 60 * 18),
      expiresAt: new Date(now + 1000 * 60 * 60 * 8),
      source: "Pune District Emergency Operations Centre",
      audience: 124800,
      delivered: 122430,
      acknowledged: 78420,
      failed: 2370,
      channelDelivery: [
        { channel: "sms", delivered: 48700, total: 49500, status: "sent" },
        { channel: "push", delivered: 56100, total: 57300, status: "sent" },
        { channel: "web", delivered: 23130, total: 24000, status: "sent" },
        { channel: "siren", delivered: 4500, total: 4500, status: "sent" },
      ],
    },
    {
      id: "AL-2026-0918-02",
      title: "Cyclone watch: coastal districts",
      message:
        "A severe cyclonic storm is expected to approach the coast within 24 hours. Secure loose objects and follow evacuation instructions from local authorities.",
      type: "cyclone",
      severity: "warning",
      status: "active",
      location: "Odisha coastline",
      affectedAreas: ["Puri", "Ganjam", "Jagatsinghpur", "Kendrapara"],
      instructions: [
        "Stay indoors and keep emergency supplies ready",
        "Charge mobile devices",
        "Follow official evacuation updates",
      ],
      channels: ["sms", "push", "web", "radio"],
      publishedAt: new Date(now - 1000 * 60 * 52),
      expiresAt: new Date(now + 1000 * 60 * 60 * 22),
      source: "State Disaster Management Authority",
      audience: 86400,
      delivered: 82910,
      acknowledged: 36680,
      failed: 3490,
      channelDelivery: [
        { channel: "sms", delivered: 33800, total: 35000, status: "sent" },
        { channel: "push", delivered: 31100, total: 32500, status: "sent" },
        { channel: "web", delivered: 12110, total: 12500, status: "sent" },
        { channel: "radio", delivered: 5900, total: 6400, status: "sending" },
      ],
    },
    {
      id: "AL-2026-0917-04",
      title: "Extreme heat advisory",
      message:
        "Daytime temperatures may exceed 44°C. Limit outdoor activity between 11:00 and 16:00 and drink water regularly.",
      type: "heatwave",
      severity: "advisory",
      status: "expired",
      location: "Vidarbha region",
      affectedAreas: ["Nagpur", "Wardha", "Akola"],
      instructions: [
        "Avoid direct sun during peak hours",
        "Check on older adults and children",
      ],
      channels: ["web", "radio"],
      publishedAt: new Date(now - 1000 * 60 * 60 * 30),
      expiresAt: new Date(now - 1000 * 60 * 60 * 4),
      source: "Regional Meteorological Centre",
      audience: 54200,
      delivered: 53520,
      acknowledged: 21400,
      failed: 680,
      channelDelivery: [
        { channel: "web", delivered: 32520, total: 33000, status: "sent" },
        { channel: "radio", delivered: 21000, total: 21200, status: "sent" },
      ],
    },
  ]);
}

router.get("/alerts", async (req, res): Promise<void> => {
  await ensureSeeded();
  const query = ListAlertsQueryParams.parse(req.query);
  const rows = await db
    .select()
    .from(alertsTable)
    .orderBy(desc(alertsTable.createdAt));

  const filtered = rows.filter((alert) => {
    const matchesStatus =
      query.status === "all" ||
      (query.status === "active" && alert.status === "active") ||
      (query.status === "draft" && alert.status === "draft") ||
      (query.status === "expired" && alert.status === "expired");
    const haystack =
      `${alert.title} ${alert.message} ${alert.location} ${alert.affectedAreas.join(" ")}`.toLowerCase();
    return (
      matchesStatus &&
      (!query.audience || haystack.includes(query.audience.toLowerCase())) &&
      (!query.search || haystack.includes(query.search.toLowerCase()))
    );
  });

  res.json(ListAlertsResponse.parse(filtered.map(toApiAlert)));
});

router.post("/alerts", async (req, res): Promise<void> => {
  const parsed = CreateAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const alert = {
    id: `AL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    ...parsed.data,
    status: "draft" as const,
    affectedAreas: parsed.data.affectedAreas,
    instructions: parsed.data.instructions,
    channels: parsed.data.channels,
    audience: 0,
    delivered: 0,
    acknowledged: 0,
    failed: 0,
    channelDelivery: parsed.data.channels.map((channel) => ({
      channel,
      delivered: 0,
      total: 0,
      status: "queued" as const,
    })),
  };
  const [created] = await db.insert(alertsTable).values(alert).returning();
  res.status(201).json(CreateAlertResponse.parse(toApiAlert(created)));
});

router.get("/alerts/:id", async (req, res): Promise<void> => {
  const params = GetAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [alert] = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.id, params.data.id));
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(GetAlertResponse.parse(toApiAlert(alert)));
});

router.patch("/alerts/:id", async (req, res): Promise<void> => {
  const params = UpdateAlertParams.safeParse(req.params);
  const parsed = UpdateAlertBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(alertsTable)
    .set(parsed.data)
    .where(and(eq(alertsTable.id, params.data.id), eq(alertsTable.status, "draft")))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Draft alert not found" });
    return;
  }
  res.json(UpdateAlertResponse.parse(toApiAlert(updated)));
});

router.post("/alerts/:id/publish", async (req, res): Promise<void> => {
  const params = PublishAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [current] = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.id, params.data.id));
  if (!current) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  const audience = current.audience || 10000 + current.channels.length * 7500;
  const [published] = await db
    .update(alertsTable)
    .set({
      status: "active",
      publishedAt: current.publishedAt ?? new Date(),
      audience,
      delivered: Math.round(audience * 0.98),
      acknowledged: Math.round(audience * 0.61),
      failed: Math.round(audience * 0.02),
      channelDelivery: current.channels.map((channel) => ({
        channel,
        delivered: Math.round(audience / current.channels.length * 0.98),
        total: Math.round(audience / current.channels.length),
        status: "sent" as const,
      })),
    })
    .where(eq(alertsTable.id, params.data.id))
    .returning();
  res.json(PublishAlertResponse.parse(toApiAlert(published)));
});

router.get("/alerts/:id/delivery", async (req, res): Promise<void> => {
  const params = GetAlertDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [alert] = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.id, params.data.id));
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(GetAlertDeliveryResponse.parse(deliveryFor(alert)));
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const rows = await db
    .select()
    .from(alertsTable)
    .orderBy(desc(alertsTable.createdAt));
  const active = rows.filter((alert) => alert.status === "active");
  const peopleReached = active.reduce((sum, alert) => sum + alert.delivered, 0);
  const totalAudience = active.reduce((sum, alert) => sum + alert.audience, 0);
  const acknowledgements = active.reduce((sum, alert) => sum + alert.acknowledged, 0);
  const channelHealth = channels.map((channel) => {
    const deliveries = active
      .flatMap((alert) => alert.channelDelivery)
      .filter((item) => item.channel === channel);
    return {
      channel,
      delivered: deliveries.reduce((sum, item) => sum + item.delivered, 0),
      total: deliveries.reduce((sum, item) => sum + item.total, 0),
      status: deliveries.some((item) => item.status === "sending") ? "sending" : "sent",
    } as const;
  });

  const activity = rows.slice(0, 5).map((alert, index) => ({
    id: `activity-${alert.id}`,
    action: alert.status === "active" ? "Alert published" : "Draft created",
    detail: `${alert.title} · ${alert.location}`,
    time: alert.publishedAt ?? alert.createdAt,
    severity: index === 0 && alert.severity === "critical" ? "critical" : "neutral",
  })) as Array<{
    id: string;
    action: string;
    detail: string;
    time: Date;
    severity: "neutral" | "success" | "warning" | "critical";
  }>;

  res.json(
    GetDashboardSummaryResponse.parse({
      activeAlerts: active.length,
      peopleReached,
      deliveryRate: totalAudience ? peopleReached / totalAudience : 0,
      acknowledgements,
      channelHealth,
      recentActivity: activity,
    }),
  );
});

export default router;