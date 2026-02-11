// src/pos/completeOrder.ts
import type {
  Order,
  OrderItem,
  OrderType,
  Payment,
  PaymentMethod,
  OrderStatus,
} from "../types";
import {
  addToSyncQueue,
  getOrders,
  setOrders,
  getCurrentUser,
  getCurrentSession,
} from "../utils/storage";
import { insertOrderToSupabase, type OrderInsert } from "../lib/orders";
function isUuid(v: any) {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    )
  );
}

function uuid() {
  return (
    crypto?.randomUUID?.() ??
    `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
  );
}

function makeOrderNo() {
  // example: 20260211-0001
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const prefix = `${y}${m}${day}`;

  const todayCount = getOrders().filter((o) =>
    String(o.orderNo ?? "").startsWith(prefix),
  ).length;
  const seq = String(todayCount + 1).padStart(4, "0");
  return `${prefix}-${seq}`;
}

function normalizeMethod(m: any): PaymentMethod {
  const s = String(m ?? "").toUpperCase();
  if (s === "CASH") return "CASH";
  if (s === "CARD") return "CARD";
  if (s === "QR") return "QR";
  if (s === "BANK") return "BANK";

  // fallback (ABA/WING/etc) — choose what you want:
  if (s.includes("QR")) return "QR";
  return "BANK";
}

function normalizePayments(payments: any[]): Payment[] {
  return (payments ?? [])
    .map((p, idx) => ({
      id:
        p?.id ??
        `pay_${Date.now()}_${idx}_${Math.random().toString(16).slice(2)}`,
      method: normalizeMethod(p?.method ?? p?.type),
      amount: Number(p?.amount ?? p?.value ?? 0),
      reference: p?.reference ?? undefined,
    }))
    .filter((p) => Number.isFinite(p.amount) && p.amount > 0);
}

export async function completeOrder(params: {
  items: OrderItem[];
  payments: any[]; // from modal -> normalize inside
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  orderType: OrderType;
  note?: string;
  pickupTime?: string | null;
}) {
  const user = getCurrentUser();
  if (!user) throw new Error("No logged in user");

  const session = getCurrentSession(); // can be null
  const id = uuid();
  const normalizedPayments = normalizePayments(params.payments);

  const localOrder: Order = {
    id,
    orderNo: makeOrderNo(),
    sessionId: isUuid(session?.id) ? session!.id : "",
    cashierId: user.id,
    orderType: params.orderType,
    status: "COMPLETED" as OrderStatus,
    items: params.items,
    payments: normalizedPayments,
    subtotal: params.subtotal,
    discount: params.discount,
    tax: params.tax,
    total: params.total,
    note: params.note ?? "",
    pickupTime: params.pickupTime ?? null,
    createdAt: new Date().toISOString(),
    printedAt: null,
    synced: false,
  };

  // 1) Save locally first (offline-safe)
  const orders = getOrders();
  setOrders([localOrder, ...orders]);

  // 2) DB shape
  const dbOrder: OrderInsert = {
    id,
    order_no: localOrder.orderNo,
    session_id: isUuid(localOrder.sessionId) ? localOrder.sessionId : null,
    cashier_id: localOrder.cashierId,
    order_type: localOrder.orderType,
    status: localOrder.status,
    items: localOrder.items,
    payments: localOrder.payments,
    subtotal: localOrder.subtotal,
    discount: localOrder.discount,
    tax: localOrder.tax,
    total: localOrder.total,
    note: localOrder.note || null,
    pickup_time: localOrder.pickupTime ?? null,
    created_at: localOrder.createdAt,
    printed_at: null,
  };

  // 3) Online → insert, else queue
  if (navigator.onLine) {
    try {
      await insertOrderToSupabase(dbOrder);

      // mark synced
      const updated = getOrders().map((o) =>
        o.id === id ? { ...o, synced: true } : o,
      );
      setOrders(updated);

      return { ok: true as const, id, queued: false as const };
    } catch (e: any) {
      console.error("❌ insertOrderToSupabase failed:", e);
      addToSyncQueue("ORDER_INSERT", dbOrder);
      return {
        ok: true as const,
        id,
        queued: true as const,
        reason: e?.message ?? "insert failed",
      };
    }
  }

  addToSyncQueue("ORDER_INSERT", dbOrder);
  return { ok: true as const, id, queued: true as const, reason: "offline" };
}
