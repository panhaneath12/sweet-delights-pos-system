import { supabase } from "./supabase"; // adjust path to your supabase client
import type { CashSession } from "../types";

export async function upsertCashSessionToSupabase(session: CashSession) {
  const { data, error } = await supabase
    .from("cash_sessions")
    .upsert(
      {
        id: session.id,
        user_id: session.userId,
        opened_at: session.openedAt,
        closed_at: session.closedAt ?? null,
        opening_amount: session.openingAmount,
        closing_amount: session.closingAmount ?? null,
        expected_amount: session.expectedAmount ?? null,
        note: session.note ?? null,
        status: session.status,
      },
      { onConflict: "id" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("❌ upsertCashSession failed:", error);
    throw error;
  }

  return data;
}

