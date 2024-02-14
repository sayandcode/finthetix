import { z } from 'zod';

const endpointErrSchema = z.object({ error: z.string() });

export function getIsEndpointError(err: unknown):
  err is z.infer<typeof endpointErrSchema> {
  return endpointErrSchema.safeParse(err).success;
}

const internalErrSchema = z.object({ message: z.string() });

export function getIsInternalError(err: unknown):
  err is z.infer<typeof internalErrSchema> {
  return internalErrSchema.safeParse(err).success;
}
