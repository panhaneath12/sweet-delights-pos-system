import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { initializeData } from './utils/initData';
import { initSyncSystem } from "../src/sync/network";
import { supabase } from "../src/lib/supabase";

function App() {
  supabase.auth.getSession().then(({ data, error }) => {
  console.log("🔌 Supabase session:", data?.session);
  if (error) console.error("❌ Supabase session error:", error);
});
  useEffect(() => {
    // Initialize mock data on first load
    initializeData();
     const cleanup = initSyncSystem();
  return cleanup;
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
