// src/sync/network.ts
import { bootstrapFromSupabase } from "../sync/bootstrap";
import { getQueueStats, syncNow } from "../sync/syncQueue";

export type SyncSystemStatus = {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt?: string;
  lastSyncError?: string;
  queue: {
    total: number;
    pending: number;
    failed: number;
    synced: number;
  };
};

type Listener = (s: SyncSystemStatus) => void;

let status: SyncSystemStatus = {
  isOnline: navigator.onLine,
  isSyncing: false,
  queue: getQueueStats(),
};

const listeners = new Set<Listener>();

function nowIso() {
  return new Date().toISOString();
}

function emit() {
  status.queue = getQueueStats();
  for (const cb of listeners) cb({ ...status, queue: { ...status.queue } });
}

export function subscribeSyncStatus(cb: Listener) {
  listeners.add(cb);
  cb({ ...status, queue: { ...status.queue } }); // initial push
  return () => listeners.delete(cb);
}

export function getSyncStatus() {
  return { ...status, queue: { ...status.queue } };
}

/**
 * Initialize network listeners.
 * Call this ONCE near app startup (e.g. in App.tsx useEffect)
 */
export function initSyncSystem() {
  const onOnline = async () => {
    status.isOnline = true;
    emit();

    // When online returns:
    // 1) bootstrap master data (users/products/categories)
    // 2) sync outbox (orders, sessions)
    await runBootstrapAndSync();
  };

  const onOffline = () => {
    status.isOnline = false;
    emit();
  };

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  // Try a first run if already online
  if (navigator.onLine) {
    runBootstrapAndSync();
  }

  emit();

  // cleanup function if needed
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

export async function runBootstrapAndSync() {
  if (!navigator.onLine) return;

  if (status.isSyncing) return; // avoid overlapping runs
  status.isSyncing = true;
  status.lastSyncError = undefined;
  emit();

  try {
    // Bootstrap (ignore offline)
    await bootstrapFromSupabase();

    // Sync queue
    const r = await syncNow({ maxEvents: 50 });
    if (!r.skipped) status.lastSyncAt = nowIso();
  } catch (e: any) {
    status.lastSyncError = String(e?.message ?? e);
  } finally {
    status.isSyncing = false;
    emit();
  }
}
