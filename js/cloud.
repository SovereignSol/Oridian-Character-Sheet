// Sol: Optional Supabase cloud sync, no build.
// Configure by copying config.example.js to config.js and filling in values.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { CHAR_STORAGE_KEY, loadCharacterState, saveCharacterState } from "./character.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";

let client = null;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } });
  return client;
}

export function isCloudConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

async function ensureAuth() {
  const sb = getSupabase();
  if (!sb) return { ok:false, message:"Supabase not configured. Create config.js from config.example.js." };

  const { data } = await sb.auth.getSession();
  if (data.session) return { ok:true, message:"Signed in." };

  const res = await sb.auth.signInAnonymously();
  if (res.error) return { ok:false, message: res.error.message };
  return { ok:true, message:"Signed in (anonymous)." };
}

export async function cloudSave() {
  const sb = getSupabase();
  if (!sb) return { ok:false, message:"Supabase not configured." };

  const auth = await ensureAuth();
  if (!auth.ok) return auth;

  const { data: sess } = await sb.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) return { ok:false, message:"No user session." };

  const state = loadCharacterState();

  const { error } = await sb.from("characters").upsert({
    user_id: uid,
    character_id: state.id,
    payload: state,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,character_id" });

  if (error) return { ok:false, message:error.message };
  return { ok:true, message:"Saved to cloud." };
}

export async function cloudLoad() {
  const sb = getSupabase();
  if (!sb) return { ok:false, message:"Supabase not configured." };

  const auth = await ensureAuth();
  if (!auth.ok) return auth;

  const { data: sess } = await sb.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) return { ok:false, message:"No user session." };

  const local = loadCharacterState();

  const { data, error } = await sb
    .from("characters")
    .select("payload")
    .eq("user_id", uid)
    .eq("character_id", local.id)
    .maybeSingle();

  if (error) return { ok:false, message:error.message };
  if (!data?.payload) return { ok:false, message:"Not found in cloud (for this character id)." };

  saveCharacterState(data.payload);
  window.dispatchEvent(new StorageEvent("storage", { key: CHAR_STORAGE_KEY }));
  return { ok:true, message:"Loaded from cloud." };
}
