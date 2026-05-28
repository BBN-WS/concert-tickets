// Shared Supabase client + helpers (loaded as ES module from CDN).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://fufkmlamvvejexfafziy.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_S_1c8CO53uFH3lywzlhhHQ_i5kQKoRO";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export async function getSessionUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getProfile(userId) {
  if (!userId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id,name,is_admin")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function requireLogin(redirectTo = "login.html") {
  const user = await getSessionUser();
  if (!user) {
    const back = encodeURIComponent(location.pathname + location.search);
    location.replace(`${redirectTo}?next=${back}`);
    return null;
  }
  return user;
}

// Tiny id helper (crypto.randomUUID guaranteed in modern browsers)
export function newId(prefix = "id") {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function formatTHB(n) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatThaiDate(d) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}
