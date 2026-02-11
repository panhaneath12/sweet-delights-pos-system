import { supabase } from "../lib/supabase";
import { bootstrapFromSupabase } from "../sync/bootstrap";
import {
  getUsers,
  setUsers,
  getCategories,
  setCategories,
  getProducts,
  setProducts,
} from "../utils/storage";

// OPTIONAL: mock data fallback
import { mockUsers, mockCategories, mockProducts } from "../utils/mockData";

const INIT_FLAG = "pos_initialized_v1";

function hasLocalData() {
  return (
    getUsers().length > 0 &&
    getCategories().length > 0 &&
    getProducts().length > 0
  );
}

export async function initializeData() {
  // If we already have data locally, do NOTHING
  if (hasLocalData()) return;

  // Prevent re-running seeding endlessly
  if (localStorage.getItem(INIT_FLAG) === "1") return;

  // Try Supabase first (online + authenticated)
  if (navigator.onLine) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const result = await bootstrapFromSupabase();
        if (result.ok) {
          localStorage.setItem(INIT_FLAG, "1");
          return;
        }
      }
    } catch {
      // silently fail → fallback below
    }
  }

  // FALLBACK: seed mock data only if still empty
  if (!hasLocalData()) {
    setUsers(mockUsers);
    setCategories(mockCategories);
    setProducts(mockProducts);
    localStorage.setItem(INIT_FLAG, "1");
  }
}
