import { z } from 'zod';
import { chainInfoSchema } from './loaders/chainInfo';

const ethAddressSchema = z.string().regex(/^0x([0-9]|[a-f]){40}$/i);

export const envSchema = z.object({
  NODE_ENV: z.union([
    z.literal('development'), z.literal('production'), z.literal('test'),
  ]) satisfies z.ZodType<typeof process.env.NODE_ENV>,
  TZ: z.string().optional() satisfies z.ZodType<typeof process.env.TZ>,

  STAKING_CONTRACT_ADDRESS: ethAddressSchema,
  STAKING_TOKEN_ADDRESS: ethAddressSchema,
  REWARD_TOKEN_ADDRESS: ethAddressSchema,

  PRODUCTION_CHAIN_INFO: z.preprocess((val) => {
    if (typeof val !== 'string') throw new Error('No JSON string set for chain info env');
    return JSON.parse(val);
  }, chainInfoSchema),
});

const parseResult = envSchema.safeParse(process.env);
if (!parseResult.success) {
  console.error(parseResult.error);
  throw new Error('Env variables not parsed as expected');
}

export const PARSED_PROCESS_ENV = parseResult.data;
