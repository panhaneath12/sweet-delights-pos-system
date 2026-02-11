// src/sync/bootstrap.ts
import { supabase } from "../lib/supabase";
import { setUsers, setCategories, setProducts } from "../utils/storage";

function nowIso() {
  return new Date().toISOString();
}

async function ensureAuthenticated() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Not authenticated. Please login first to bootstrap.");
}

function normalizeVariants(productId: string, raw: any) {
  const arr = Array.isArray(raw)
    ? raw
    : (() => {
        try {
          return typeof raw === "string" ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      })();

  return arr.map((v: any, idx: number) => ({
    id: v.id ?? `${productId}_var_${idx}`,
    name: v.name ?? v.label ?? "Option",
    type: v.type ?? v.variant_type ?? "SIZE", // default to SIZE if missing
    extraPrice: Number(v.extraPrice ?? v.extra_price ?? 0),
    active: v.active ?? true,
  }));
}

export async function bootstrapFromSupabase() {
  if (!navigator.onLine) return { ok: false, reason: "offline" as const };

  await ensureAuthenticated();

  // USERS
  const { data: users, error: uErr } = await supabase
    .from("pos_users")
    .select("id,name,username,role,active,created_at")
    .order("created_at", { ascending: true });

  if (uErr) {
    console.error("❌ Users error:", uErr);
    return { ok: false as const };
  }

  setUsers(
    (users ?? []).map((u: any) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      active: u.active,
      createdAt: u.created_at,
    }))
  );

  // CATEGORIES
  const { data: categories, error: cErr } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (cErr) {
    console.error("❌ Categories error:", cErr);
    return { ok: false as const };
  }

  setCategories(
    (categories ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sort_order,
      active: c.active,
      createdAt: c.created_at,
    }))
  );

  // PRODUCTS
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (pErr) {
    console.error("❌ Products error:", pErr);
    return { ok: false as const };
  }

  setProducts(
    (products ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      basePrice: Number(p.base_price ?? 0),
      categoryId: p.category_id,
      image: p.image,
      active: p.active,
      variants: normalizeVariants(p.id, p.variants),
      updatedAt: p.updated_at,
    }))
  );

  console.log("✅ Supabase bootstrap complete", { at: nowIso() });
  return { ok: true as const, at: nowIso() };
}
