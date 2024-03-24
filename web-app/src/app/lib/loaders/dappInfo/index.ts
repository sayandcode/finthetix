import getServerEnv from '../../env';
import { DappInfo } from './schema';

export function getDappInfo(): DappInfo {
  const env = getServerEnv();
  return {
    stakingContractAddr: env.STAKING_CONTRACT_ADDRESS,
    stakingTokenAddr: env.STAKING_TOKEN_ADDRESS,
    rewardTokenAddr: env.REWARD_TOKEN_ADDRESS,
  };
}
