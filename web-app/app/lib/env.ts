import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.union([
    z.literal('development'), z.literal('production'), z.literal('test'),
  ]) satisfies z.ZodType<typeof process.env.NODE_ENV>,
  TZ: z.string().optional() satisfies z.ZodType<typeof process.env.TZ>,
});

const parseResult = envSchema.safeParse(process.env);
if (!parseResult.success) {
  console.error(parseResult.error);
  throw new Error('Env variables not parsed as expected');
}

export const PARSED_PROCESS_ENV = parseResult.data;
