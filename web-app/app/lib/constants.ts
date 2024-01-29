import { ChainInfo } from './types';

export const LOCAL_CHAIN_INFO: ChainInfo = {
  iconUrls: [],
  nativeCurrency: {
    name: 'xANV',
    symbol: 'xANV',
    decimals: 18,
  },
  rpcUrls: [
    'http://localhost:8545',
  ],
  chainId: `0x${(31337).toString(16)}`,
  chainName: 'Anvil',
};
