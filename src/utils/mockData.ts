import type { User, Category, Product } from "../types";

/**
 * IMPORTANT:
 * - No plaintext PIN for Option B (offline hash will be provisioned after online login)
 * - Use DB column naming style:
 *   categories: sort_order
 *   products: base_price, category_id, variants (json array)
 */

export const mockUsers: User[] = [
  {
    id: crypto.randomUUID(),
    name: "Owner (Local)",
    username: "admin",
    role: "ADMIN",
    active: true,
    createdAt: "2026-02-10T00:00:00Z",
    // no pin here
  } as any,
  {
    id: "user_cashier_local_1",
    name: "Cashier 1 (Local)",
    username: "cashier1",
    role: "CASHIER",
    active: true,
    createdAt: "2026-02-10T00:00:00Z",
  } as any,
];

export const mockCategories: Category[] = [
  {
    id: "cat_cakes_local",
    name: "Cakes",
    sort_order: 1,
    active: true,
  } as any,
  {
    id: "cat_drinks_local",
    name: "Drinks",
    sort_order: 2,
    active: true,
  } as any,
  {
    id: "cat_bread_local",
    name: "Bread",
    sort_order: 3,
    active: true,
  } as any,
  {
    id: "cat_pastries_local",
    name: "Pastries",
    sort_order: 4,
    active: true,
  } as any,
];

export const mockProducts: Product[] = [
  {
    id: "prod_choc_cake_local",
    name: "Chocolate Cake",
    base_price: 15.0,
    category_id: "cat_cakes_local",
    image: null,
    active: true,
    variants: [
      { name: "Small", extra_price: 0 },
      { name: "Medium", extra_price: 5 },
      { name: "Large", extra_price: 10 },
    ],
    updated_at: new Date().toISOString(),
  } as any,
  {
    id: "prod_straw_cake_local",
    name: "Strawberry Cake",
    base_price: 18.0,
    category_id: "cat_cakes_local",
    image: null,
    active: true,
    variants: [
      { name: "Small", extra_price: 0 },
      { name: "Medium", extra_price: 6 },
      { name: "Large", extra_price: 12 },
    ],
    updated_at: new Date().toISOString(),
  } as any,
  {
    id: "prod_iced_latte_local",
    name: "Iced Latte",
    base_price: 3.8,
    category_id: "cat_drinks_local",
    image: null,
    active: true,
    variants: [
      { name: "Regular", extra_price: 0 },
      { name: "Large", extra_price: 1 },
    ],
    updated_at: new Date().toISOString(),
  } as any,
  {
    id: "prod_baguette_local",
    name: "Baguette",
    base_price: 1.8,
    category_id: "cat_bread_local",
    image: null,
    active: true,
    variants: [],
    updated_at: new Date().toISOString(),
  } as any,
  {
    id: "prod_croissant_local",
    name: "Croissant",
    base_price: 2.2,
    category_id: "cat_pastries_local",
    image: null,
    active: true,
    variants: [],
    updated_at: new Date().toISOString(),
  } as any,
];
