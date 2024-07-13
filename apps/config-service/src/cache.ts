import { Namespace, createCache } from "@unkey/cache";
import { CloudflareStore, MemoryStore } from "@unkey/cache/stores";
import { Env } from "./server";
import { CloudflareKVStore } from "./stores/kv-store";

const memory = new MemoryStore({ persistentMap: new Map() });

export function getCache(ctx: ExecutionContext, env: Env) {
  const cloudflareCacheStore = new CloudflareStore({
    domain: env.CLOUDFLARE_DOMAIN,
    zoneId: env.CLOUDFLARE_ZONE_ID,

    // Note: This is only used for purging, and is not required for reading/writing
    cloudflareApiKey: env.CLOUDFLARE_API_KEY,
  });

  const cloudflareKVStore = new CloudflareKVStore({
    namespace: env.CONFIG_KV,
  });

  const configNamespace = new Namespace<unknown>(ctx, {
    /**
     * Specifying first `memory`, then `cloudflare` will automatically check both stores in order
     * If a value is found in memory, it is returned, else it will check cloudflare, and if it's found
     * in cloudflare, the value is backfilled to memory.
     */
    stores: [memory, cloudflareCacheStore, cloudflareKVStore],
    fresh: 5_000, // Data is fresh for 5 seconds
    stale: 300_000, // Data is stale for 300 seconds
  });

  return createCache({
    config: configNamespace,
  });
}

export type ConfigCache = ReturnType<typeof getCache>;
