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

export const FINTHETIX_GITHUB_URL = 'https://www.github.com/sayandcode/finthetix';

export const DEVELOPER_PORTFOLIO_URL = 'https://www.sayand.in';

export const DEVELOPER_SOCIAL_MEDIA_URL = 'https://twitter.com/sayandcode';
