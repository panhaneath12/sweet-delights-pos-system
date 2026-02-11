import { supabase } from "./supabase";
import type { User } from "../types";

export async function fetchUsersFromSupabase(): Promise<User[]> {
  const { data, error } = await supabase
    .from("pos_users")
    .select("id,name,username,role,active,pin_hash,pin_salt,pin_iter")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((u: any) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    active: u.active,
    pinHash: u.pin_hash ?? undefined,
    pinSalt: u.pin_salt ?? undefined,
    pinIter: u.pin_iter ?? undefined,
  }));
}

export async function upsertUserToSupabase(user: User) {
  const { error } = await supabase.from("pos_users").upsert(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      active: user.active,
      pin_hash: user.pinHash ?? null,
      pin_salt: user.pinSalt ?? null,
      pin_iter: user.pinIter ?? null,
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

export async function setUserActiveSupabase(userId: string, active: boolean) {
  const { error } = await supabase.from("pos_users").update({ active }).eq("id", userId);
  if (error) throw error;
}
