import { supabase } from "./supabase";
import type { Product, Category } from "../types";

export async function fetchCategoriesFromSupabase(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,sort_order,active")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sort_order,
    active: c.active,
  }));
}

export async function upsertCategoryToSupabase(category: Category) {
  const { error } = await supabase.from("categories").upsert(
    {
      id: category.id,
      name: category.name,
      sort_order: category.sortOrder,
      active: category.active,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function deleteCategoryFromSupabase(categoryId: string) {
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) throw error;
}

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,base_price,category_id,image,active")
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    basePrice: Number(p.base_price),
    categoryId: p.category_id,
    image: p.image ?? undefined,
    active: p.active,
  }));
}

export async function upsertProductToSupabase(product: Product) {
  const { error } = await supabase.from("products").upsert(
    {
      id: product.id,
      name: product.name,
      base_price: product.basePrice,
      category_id: product.categoryId,
      image: product.image ?? null,
      active: product.active,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function deleteProductFromSupabase(productId: string) {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
}
