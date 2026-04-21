import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "logos";

const supabase = url && serviceKey ? createClient(url, serviceKey) : null;

function normalizeHandle(raw: string): string {
  return raw
    .replace(/^https?:\/\/(www\.)?(x\.com|twitter\.com)\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
    .trim();
}

/**
 * Fetch a company's X/Twitter avatar via unavatar.io and upload it to the
 * Supabase Storage `logos` bucket as `{companyId}.png`. Returns the filename
 * on success, or null on any failure — logo fetch should never block signup.
 */
export async function fetchAndStoreTwitterLogo(
  handleOrUrl: string,
  companyId: string,
): Promise<string | null> {
  if (!supabase) {
    console.warn("[logo] supabase not configured; skipping logo fetch");
    return null;
  }

  const handle = normalizeHandle(handleOrUrl);
  if (!handle) return null;

  try {
    const res = await fetch(
      `https://unavatar.io/twitter/${encodeURIComponent(handle)}?fallback=false`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) {
      console.warn(`[logo] unavatar returned ${res.status} for @${handle}`);
      return null;
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength < 200) return null;

    const contentType = res.headers.get("content-type")?.split(";")[0].trim() || "image/jpeg";
    const ext = contentType === "image/png" ? "png"
      : contentType === "image/webp" ? "webp"
      : contentType === "image/gif" ? "gif"
      : "jpg";
    const filename = `${companyId}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(filename, bytes, {
      contentType,
      upsert: true,
      cacheControl: "86400",
    });
    if (error) {
      console.warn(`[logo] upload failed for @${handle}: ${error.message}`);
      return null;
    }
    return filename;
  } catch (err) {
    console.warn(`[logo] fetch error for @${handle}:`, (err as Error).message);
    return null;
  }
}
