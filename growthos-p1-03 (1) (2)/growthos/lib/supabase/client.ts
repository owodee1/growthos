import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

// For use in browser (client) components.
export function createClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.key);
}
