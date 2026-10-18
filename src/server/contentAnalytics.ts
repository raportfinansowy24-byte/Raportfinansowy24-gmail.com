import { createClient } from "@supabase/supabase-js";
import { supabase, getIsSupabaseAvailable } from "../lib/supabase.js";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const serverSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const analyticsDb = serviceRoleKey && serverSupabaseUrl
  ? createClient(serverSupabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : supabase;
import { v4 as uuidv4 } from "uuid";

export const CONTENT_EVENT_NAMES = [
  "page_view",
  "affiliate_click",
  "lead_submit",
  "affiliate_conversion",
] as const;
export type ContentEventName = (typeof CONTENT_EVENT_NAMES)[number];

export interface ContentAttribution {
  visitor_id?: string;
  video_id?: string;
  hook_id?: string;
  platform?: string;
  topic?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  clickid?: string;
  page_path?: string;
  value?: number;
  is_test?: boolean;
  metadata?: Record<string, unknown>;
}

const clean = (value: unknown, max = 160): string | undefined =>
  typeof value === "string" && value.trim()
    ? value.trim().replace(/[<>\u0000-\u001f]/g, "").slice(0, max)
    : undefined;

export function normalizeAttribution(input: unknown): ContentAttribution {
  const data = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const out: ContentAttribution = {};
  for (const key of [
    "visitor_id", "video_id", "hook_id", "platform", "topic", "utm_source",
    "utm_medium", "utm_campaign", "utm_content", "utm_term", "clickid", "page_path"
  ] as const) {
    const value = clean(data[key], key === "page_path" ? 300 : 160);
    if (value) out[key] = value;
  }
  if (typeof data.value === "number" && Number.isFinite(data.value) && data.value >= 0) {
    out.value = Math.round(data.value * 100) / 100;
  }
  if (typeof data.is_test === "boolean") out.is_test = data.is_test;
  if (data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)) {
    out.metadata = data.metadata as Record<string, unknown>;
  }
  return out;
}

export async function recordContentEvent(
  eventName: ContentEventName,
  input: unknown,
  options: { requireDatabase?: boolean } = {}
): Promise<{ stored: boolean; id: string }> {
  const attribution = normalizeAttribution(input);
  const id = uuidv4();
  const row = {
    id,
    event_name: eventName,
    visitor_id: attribution.visitor_id ?? null,
    video_id: attribution.video_id ?? null,
    hook_id: attribution.hook_id ?? null,
    platform: attribution.platform ?? null,
    topic: attribution.topic ?? null,
    utm_source: attribution.utm_source ?? null,
    utm_medium: attribution.utm_medium ?? null,
    utm_campaign: attribution.utm_campaign ?? null,
    utm_content: attribution.utm_content ?? null,
    utm_term: attribution.utm_term ?? null,
    clickid: attribution.clickid ?? null,
    page_path: attribution.page_path ?? null,
    value: attribution.value ?? null,
    is_test: attribution.is_test ?? false,
    metadata: attribution.metadata ?? {},
    created_at: new Date().toISOString(),
  };

  if (!getIsSupabaseAvailable()) {
    if (options.requireDatabase) throw new Error("Supabase is not configured; analytics event was not persisted.");
    console.warn("[ContentAnalytics] Supabase unavailable; event not persisted", eventName, id);
    return { stored: false, id };
  }
  const { error } = await analyticsDb.from("content_analytics_events").insert([row]);
  if (error) {
    console.error("[ContentAnalytics] Failed to persist event:", error.message);
    if (options.requireDatabase) throw new Error("Analytics storage failed.");
    return { stored: false, id };
  }
  return { stored: true, id };
}

export async function findClickAttribution(clickid: string): Promise<ContentAttribution> {
  if (!getIsSupabaseAvailable() || !clickid) return {};
  const { data, error } = await supabase
    .from("content_analytics_events")
    .select("visitor_id,video_id,hook_id,platform,topic,utm_source,utm_medium,utm_campaign,utm_content,utm_term,is_test")
    .eq("event_name", "affiliate_click")
    .eq("clickid", clickid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return {};
  return normalizeAttribution(data);
}

export async function getContentAnalyticsReport(options: { includeTests?: boolean } = {}) {
  if (!getIsSupabaseAvailable()) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("content_analytics_events")
    .select("event_name,visitor_id,video_id,hook_id,platform,topic,utm_source,utm_campaign,utm_content,clickid,value,is_test,created_at")
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error) throw new Error("Could not read analytics events: " + error.message);

  const rows = (data ?? []).filter((row: any) => options.includeTests || row.is_test !== true);
  const groups = new Map<string, any>();
  const clicks = new Set<string>();
  const conversions = new Set<string>();
  for (const row of rows as any[]) {
    const key = [row.video_id || "unassigned", row.hook_id || "unassigned", row.platform || row.utm_source || "unassigned", row.topic || "unassigned"].join("|");
    if (!groups.has(key)) groups.set(key, {
      video_id: row.video_id || null,
      hook_id: row.hook_id || null,
      platform: row.platform || row.utm_source || null,
      topic: row.topic || null,
      page_views: 0, affiliate_clicks: 0, leads: 0, conversions: 0,
      confirmed_revenue: 0, last_event_at: row.created_at,
    });
    const group = groups.get(key);
    if (row.event_name === "page_view") group.page_views++;
    if (row.event_name === "affiliate_click") {
      group.affiliate_clicks++;
      if (row.clickid) clicks.add(row.clickid);
    }
    if (row.event_name === "lead_submit") group.leads++;
    if (row.event_name === "affiliate_conversion") {
      group.conversions++;
      if (row.clickid) conversions.add(row.clickid);
      group.confirmed_revenue += Number(row.value || 0);
    }
  }
  return {
    generated_at: new Date().toISOString(),
    test_events_included: options.includeTests === true,
    event_count: rows.length,
    totals: {
      page_views: rows.filter((r: any) => r.event_name === "page_view").length,
      affiliate_clicks: rows.filter((r: any) => r.event_name === "affiliate_click").length,
      leads: rows.filter((r: any) => r.event_name === "lead_submit").length,
      conversions: rows.filter((r: any) => r.event_name === "affiliate_conversion").length,
      confirmed_revenue: rows.filter((r: any) => r.event_name === "affiliate_conversion").reduce((sum: number, r: any) => sum + Number(r.value || 0), 0),
    },
    by_content: Array.from(groups.values()).sort((a, b) => b.confirmed_revenue - a.confirmed_revenue || b.affiliate_clicks - a.affiliate_clicks),
    note: "Revenue counts only affiliate_conversion events received through postback. Test events are excluded unless includeTests=true.",
  };
}
