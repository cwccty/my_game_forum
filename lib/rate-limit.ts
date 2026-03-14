type RateLimitOptions = {
  max: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

function getNow() {
  return Date.now();
}

function cleanupExpired(now: number) {
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function assertRateLimit(scope: string, key: string, options: RateLimitOptions) {
  const now = getNow();
  cleanupExpired(now);

  const bucketKey = `${scope}:${key}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs
    });

    return;
  }

  if (current.count >= options.max) {
    throw new Error("操作过于频繁，请稍后再试");
  }

  current.count += 1;
  buckets.set(bucketKey, current);
}
