import { z } from 'zod';
import { chainInfoSchema } from '../loaders/chainInfo/schema';
import { dappInfoSchema } from '../loaders/dappInfo/schema';
import { blockExplorerInfoSchema } from '../loaders/blockExplorerInfo/schema';
import { cacheAgeSchema } from '../loaders/cacheConfig/schema';

export const envSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']) satisfies z.ZodType<typeof process.env.NODE_ENV>,
  TZ: z.string().optional() satisfies z.ZodType<typeof process.env.TZ>,

  // dappInfo
  STAKING_CONTRACT_ADDRESS: dappInfoSchema.shape.stakingContractAddr,
  STAKING_TOKEN_ADDRESS: dappInfoSchema.shape.stakingTokenAddr,
  REWARD_TOKEN_ADDRESS: dappInfoSchema.shape.rewardTokenAddr,

  // chainInfo
  PRODUCTION_CHAIN_INFO: z.preprocess((val) => {
    if (typeof val !== 'string') throw new Error('No JSON string set for chain info env');
    return JSON.parse(val);
  }, chainInfoSchema),

  // blockExplorer
  BLOCK_EXPLORER_TX_URL: blockExplorerInfoSchema.shape.txUrl,
  BLOCK_EXPLORER_ADDRESS_URL: blockExplorerInfoSchema.shape.addressUrl,

  // cache-control
  STATIC_CACHE_TIME_IN_S: cacheAgeSchema,

  // express server config
  /// used to run production server locally (serve static assets)
  IS_RUNNING_LOCALLY: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});
