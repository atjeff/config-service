# Config Service POC

## Motivation
It's my personal opinion that feature flags / application configs should not introduce any meaningful latency into any. This implementation attempts to avoid this with a multi faceted approach.

## Implementation
1. Cloudflare Workers Service Binding
  - For applications hosted on cloudflare workers / pages, the service can be bound. When called out to, the config service can be spun up on the same worker isolate, with 0ms latency. This is essentially a "micro" service without communcation latency.

2. Multi-Tier Caching via @unkey/cache library
- In-Memory Cache (Per Worker)
  - This simply stores the key/value in a javascript `Map` within the worker.
  - Workers stay alive a lot longer than you think they do: https://x.com/chronark_/status/1772262893498601501
- Cloudflare CDN Cache (Per PoP)
  - Cloudflare allows for programmatic cache control via workers. Their cache is extremely fast and durable.
  - https://developers.cloudflare.com/workers/runtime-apis/cache.
- Cloudflare KV Cache (Global)
  - Cloudflare KV is a global key value store that is eventually consistent.
  - This is the slowest cache, but is the most durable. Configs will stay here indefinetly.
  - https://developers.cloudflare.com/workers/runtime-apis/kv

## Notes
- The cache is checked in the order of In-Memory (~0ms) -> Cache (~50ms) -> (~1500ms) KV. This allows for the fastest possible response time. If any of the caches are missing, the next cache is checked until a value is found, and backfills the rest.

- It's important to highlight that both the in-memory and cache scenarios happen in the PoP closest to the user, which for a majority of the world is within 50ms. 

- The worst case scenario is that the config hasn't been fetched in the PoP closest to the user, falling back to KV. This should only happen once per PoP. In any production site with even minimal traffic, this will greatly outperform any config or feature flag service that has to reach out to a centralized server/db/redis cache.
