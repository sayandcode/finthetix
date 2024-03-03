import { LOCAL_CHAIN_INFO } from './constants';
import { PARSED_PROCESS_ENV } from './env';
import { ChainInfo, DappInfo } from './types';

export function getChainInfo(): ChainInfo {
  return PARSED_PROCESS_ENV.NODE_ENV === 'development' ? LOCAL_CHAIN_INFO : {};
}

export function getDappInfo(): DappInfo {
  return {
    stakingContractAddr: PARSED_PROCESS_ENV.STAKING_CONTRACT_ADDRESS,
    stakingTokenAddr: PARSED_PROCESS_ENV.STAKING_TOKEN_ADDRESS,
    rewardTokenAddr: PARSED_PROCESS_ENV.REWARD_TOKEN_ADDRESS,
  };
}
