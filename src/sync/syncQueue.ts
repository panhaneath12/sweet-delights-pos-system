// src/sync/syncQueue.ts
import { supabase } from "../lib/supabase";

export type SyncEventType =
  | "ORDER_UPSERT"
  | "CASH_SESSION_UPSERT"
  | "CASH_SESSION_CLOSE";

export type SyncEventStatus = "PENDING" | "SYNCED" | "FAILED";

export type SyncEvent = {
  id: string; // uuid or unique string
  type: SyncEventType;
  payload: any;
  status: SyncEventStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  tryCount: number;
  lastError?: string;
};

const LS_KEY = "pos_sync_outbox_v1";

/** ---------- localStorage helpers ---------- */
function readQueue(): SyncEvent[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: SyncEvent[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(queue));
}

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  // Use crypto.randomUUID if available
  // (works in modern browsers)
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** ---------- Public APIs ---------- */
export function getSyncQueue(): SyncEvent[] {
  return readQueue();
}

export function getQueueStats() {
  const q = readQueue();
  return {
    total: q.length,
    pending: q.filter((e) => e.status === "PENDING").length,
    failed: q.filter((e) => e.status === "FAILED").length,
    synced: q.filter((e) => e.status === "SYNCED").length,
  };
}

export function enqueue(type: SyncEventType, payload: any) {
  const q = readQueue();
  const t = nowIso();

  const ev: SyncEvent = {
    id: makeId(),
    type,
    payload,
    status: "PENDING",
    createdAt: t,
    updatedAt: t,
    tryCount: 0,
  };

  q.push(ev);
  writeQueue(q);
  return ev.id;
}

export function markAllPending() {
  const q = readQueue();
  const t = nowIso();
  for (const ev of q) {
    if (ev.status === "FAILED") {
      ev.status = "PENDING";
      ev.updatedAt = t;
      ev.lastError = undefined;
    }
  }
  writeQueue(q);
}

export function clearSynced() {
  const q = readQueue();
  const kept = q.filter((e) => e.status !== "SYNCED");
  writeQueue(kept);
}

/** ---------- Core sync logic ---------- */
async function ensureAuthenticated() {
  const { data } = await supabase.auth.getSession();
  // If you allow syncing only after login:
  if (!data.session) {
    throw new Error("Not authenticated. Please login first to sync.");
  }
}

async function syncEvent(ev: SyncEvent) {
  // Map event type -> Supabase operation
  if (ev.type === "ORDER_UPSERT") {
    // expects payload shaped like your orders table columns
    const { error } = await supabase.from("orders").upsert(ev.payload);
    if (error) throw error;
    return;
  }

  if (ev.type === "CASH_SESSION_UPSERT") {
    const { error } = await supabase.from("cash_sessions").upsert(ev.payload);
    if (error) throw error;
    return;
  }

  if (ev.type === "CASH_SESSION_CLOSE") {
    // closing is also an upsert/update
    const { error } = await supabase.from("cash_sessions").upsert(ev.payload);
    if (error) throw error;
    return;
  }

  // Safety
  throw new Error(`Unknown sync event type: ${ev.type}`);
}

export async function syncNow(opts?: { maxEvents?: number }) {
  if (!navigator.onLine) return { synced: 0, failed: 0, skipped: true };

  await ensureAuthenticated();

  const maxEvents = opts?.maxEvents ?? 50;
  const q = readQueue();

  // Only sync pending first; (optionally include failed after retry)
  const pending = q.filter((e) => e.status === "PENDING").slice(0, maxEvents);

  if (pending.length === 0) return { synced: 0, failed: 0, skipped: false };

  let synced = 0;
  let failed = 0;
  const t = nowIso();

  for (const ev of pending) {
    try {
      ev.tryCount += 1;
      ev.updatedAt = t;

      await syncEvent(ev);

      ev.status = "SYNCED";
      ev.lastError = undefined;
      synced += 1;
    } catch (err: any) {
      ev.status = "FAILED";
      ev.lastError = String(err?.message ?? err);
      ev.updatedAt = nowIso();
      failed += 1;
    }
  }

  writeQueue(q);
  return { synced, failed, skipped: false };
}
