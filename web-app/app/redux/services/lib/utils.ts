import { z } from 'zod';

export function getIsEndpointError(err: unknown):
  err is { error: string } {
  return z
    .object({ error: z.string() })
    .safeParse(err)
    .success;
}
