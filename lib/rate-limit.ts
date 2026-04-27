import "server-only";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_SECONDS = 60;

const memoryFallback = new Map<string, { count: number; resetAt: number }>();

interface CheckArgs {
  key: string;
  limit?: number;
  windowSeconds?: number;
}

interface CheckResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

function checkMemory({ key, limit = DEFAULT_LIMIT, windowSeconds = DEFAULT_WINDOW_SECONDS }: CheckArgs): CheckResult {
  const now = Date.now();
  const record = memoryFallback.get(key);
  if (!record || now > record.resetAt) {
    const resetAt = now + windowSeconds * 1000;
    memoryFallback.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }
  record.count += 1;
  if (record.count > limit) {
    return { ok: false, remaining: 0, resetAt: record.resetAt };
  }
  return { ok: true, remaining: limit - record.count, resetAt: record.resetAt };
}

export async function checkRateLimit(args: CheckArgs): Promise<CheckResult> {
  const limit = args.limit ?? DEFAULT_LIMIT;
  const windowSeconds = args.windowSeconds ?? DEFAULT_WINDOW_SECONDS;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("rate_limit_hit", {
      p_key: args.key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("rate_limit_hit returned no row");
    return {
      ok: Boolean(row.allowed),
      remaining: Number(row.remaining ?? 0),
      resetAt: new Date(row.reset_at).getTime(),
    };
  } catch {
    return checkMemory({ key: args.key, limit, windowSeconds });
  }
}
