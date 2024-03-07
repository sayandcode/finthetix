import { PARSED_PROCESS_ENV } from '../env';

export type DappInfo = {
  stakingContractAddr: string
  stakingTokenAddr: string
  rewardTokenAddr: string
};

export function getDappInfo(): DappInfo {
  return {
    stakingContractAddr: PARSED_PROCESS_ENV.STAKING_CONTRACT_ADDRESS,
    stakingTokenAddr: PARSED_PROCESS_ENV.STAKING_TOKEN_ADDRESS,
    rewardTokenAddr: PARSED_PROCESS_ENV.REWARD_TOKEN_ADDRESS,
  };
}
