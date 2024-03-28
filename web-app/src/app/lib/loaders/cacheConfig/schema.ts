import { z } from 'zod';

export type CacheConfig = {
  serverMaxAge: number
  staleWhileRevalidate: number
};

export const cacheAgeSchema = z.coerce.number().gte(1);
