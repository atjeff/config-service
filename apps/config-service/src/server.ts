import { WorkerEntrypoint } from "cloudflare:workers";
import { ConfigCache, getCache } from "./cache";

export type Env = {
  CLOUDFLARE_DOMAIN: string;
  CLOUDFLARE_ZONE_ID: string;
  CLOUDFLARE_API_KEY: string;

  CONFIG_KV: KVNamespace;
};

export default class extends WorkerEntrypoint {
  private cache: ConfigCache;

  constructor(ctx: ExecutionContext, env: Env) {
    super(ctx, env);

    this.cache = getCache(ctx, env);
  }

  async get(key: string) {
    return await this.cache.config.get(key);
  }

  async set(key: string, value: string) {
    return this.cache.config.set(key, value);
  }

  async delete(key: string) {
    return this.cache.config.remove(key);
  }

  // https://github.com/cloudflare/workers-sdk/issues/5663#issuecomment-2216980515
  fetch() {
    return new Response(null, { status: 404 });
  }
}
