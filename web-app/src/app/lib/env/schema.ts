import { z } from 'zod';
import { chainInfoSchema } from '../loaders/chainInfo/schema';
import { dappInfoSchema } from '../loaders/dappInfo/schema';
import { blockExplorerInfoSchema } from '../loaders/blockExplorerInfo/schema';

export const envSchema = z.object({
  NODE_ENV: z.union([
    z.literal('development'), z.literal('production'), z.literal('test'),
  ]) satisfies z.ZodType<typeof process.env.NODE_ENV>,
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
});
