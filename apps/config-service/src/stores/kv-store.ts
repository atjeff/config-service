import { CacheError, Entry, Store } from "@unkey/cache";
import { Err, Ok, type Result } from "@unkey/error";
import superjson from "superjson";

export type CloudflareKVStoreConfig = {
  namespace: KVNamespace;
};

export class CloudflareKVStore<TNamespace extends string, TValue = any>
  implements Store<TNamespace, TValue>
{
  private readonly config: CloudflareKVStoreConfig;
  public readonly name = "cloudflare-kv";

  constructor(config: CloudflareKVStoreConfig) {
    this.config = config;
  }

  private createCacheKey(namespace: TNamespace, key: string): string {
    return `${namespace}:${key}`;
  }

  public async get(
    namespace: TNamespace,
    key: string
  ): Promise<Result<Entry<TValue> | undefined, CacheError>> {
    let value: string | null;
    try {
      value = await this.config.namespace.get(
        this.createCacheKey(namespace, key)
      );
    } catch (err) {
      return Err(
        new CacheError({
          tier: this.name,
          key,
          message: (err as Error).message,
        })
      );
    }

    if (!value) {
      return Ok(undefined);
    }

    try {
      const entry = superjson.parse(value) as Entry<TValue>;

      return Ok(entry);
    } catch (err) {
      return Err(
        new CacheError({
          tier: this.name,
          key,
          message: (err as Error).message,
        })
      );
    }
  }

  public async set(
    namespace: TNamespace,
    key: string,
    entry: Entry<TValue>
  ): Promise<Result<void, CacheError>> {
    const value = superjson.stringify(entry);

    try {
      await this.config.namespace.put(
        this.createCacheKey(namespace, key),
        value,
        {
          expirationTtl: Math.floor(entry.staleUntil / 1000),
        }
      );

      return Ok();
    } catch (err) {
      return Err(
        new CacheError({
          tier: this.name,
          key,
          message: (err as Error).message,
        })
      );
    }
  }

  public async remove(
    namespace: TNamespace,
    key: string
  ): Promise<Result<void, CacheError>> {
    try {
      await this.config.namespace.delete(this.createCacheKey(namespace, key));

      return Ok();
    } catch (err) {
      return Err(
        new CacheError({
          tier: this.name,
          key,
          message: (err as Error).message,
        })
      );
    }
  }
}
