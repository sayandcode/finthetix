import { z } from 'zod';
import { chainInfoSchema } from '../loaders/chainInfo/schema';
import { dappInfoSchema } from '../loaders/dappInfo/schema';
import { blockExplorerInfoSchema } from '../loaders/blockExplorerInfo/schema';
import { cacheAgeSchema } from '../loaders/cacheConfig/schema';

export const envSchema = z.object({
  // node vars
  NODE_ENV: z.enum(['production', 'development', 'test']) satisfies z.ZodType<typeof process.env.NODE_ENV>,
  TZ: z.string().optional() satisfies z.ZodType<typeof process.env.TZ>,

  // dappInfo
  /** The ETH address of the staking contract */
  STAKING_CONTRACT_ADDRESS: dappInfoSchema.shape.stakingContractAddr,

  /** The ETH address of the staking token */
  STAKING_TOKEN_ADDRESS: dappInfoSchema.shape.stakingTokenAddr,

  /** The ETH address of the reward token */
  REWARD_TOKEN_ADDRESS: dappInfoSchema.shape.rewardTokenAddr,

  // chainInfo
  /**
   * The chain info for production environment. This is ignored on local,
   * in favour of the local anvil chain
   */
  PRODUCTION_CHAIN_INFO: z.preprocess((val) => {
    if (typeof val !== 'string') throw new Error('No JSON string set for chain info env');
    return JSON.parse(val);
  }, chainInfoSchema),

  // blockExplorer
  /**
   * The base url for the transaction page on the block explorer.
   * Will be appended with the txn hash
   */
  BLOCK_EXPLORER_TX_URL: blockExplorerInfoSchema.shape.txUrl,

  /**
   * The base url for the address page on the block explorer.
   * Will be appended with the ETH address
   */
  BLOCK_EXPLORER_ADDRESS_URL: blockExplorerInfoSchema.shape.addressUrl,

  // cache-control
  /** The time in seconds, for which you wish to cache the static pages */
  STATIC_CACHE_TIME_IN_S: cacheAgeSchema,

  // rpc server
  /** The maximum number of blocks queryable by the RPC  */
  RPC_QUERY_MAX_BLOCK_COUNT:
    z.coerce.number().gt(0),

  // express server config
  /** Boolean flag used to run production server locally.
   * It decides whether or not to serve static assets
   */
  IS_RUNNING_LOCALLY: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});
