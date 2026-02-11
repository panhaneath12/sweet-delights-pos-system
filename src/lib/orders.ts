import { supabase } from "../lib/supabase";

export type OrderInsert = {
  id: string;
  order_no: string;
  session_id: string | null;
  cashier_id: string;
  order_type: string;
  status: string;
  items: any[];
  payments: any[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  note?: string | null;
  pickup_time?: string | null;
  created_at?: string;
  printed_at?: string | null;
};

export async function insertOrderToSupabase(order: OrderInsert) {
  console.log("🛰️ inserting order payload:", order);

  const { data, error } = await supabase
    .from("orders")
    .upsert(order, { onConflict: "order_no" })
    .select("id")
    .single();

  if (error) {
    console.error("❌ Supabase insert error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }
  console.log("✅ order inserted:", data);
  return data;
  
}







export async function markOrderPrintedInSupabase(orderId: string, printedAt: string) {
  const { error } = await supabase
    .from("orders")
    .update({ printed_at: printedAt })
    .eq("id", orderId);

  if (error) throw error;
}
