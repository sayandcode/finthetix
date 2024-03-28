import getServerEnv from '~/lib/env';
import { CacheConfig } from './schema';

export default function getCacheConfig(): CacheConfig {
  const { STATIC_CACHE_TIME_IN_S } = getServerEnv();

  return {
    serverMaxAge: STATIC_CACHE_TIME_IN_S,
    staleWhileRevalidate: Math.floor(STATIC_CACHE_TIME_IN_S * 0.9),
  };
}
