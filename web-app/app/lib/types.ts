export type TrialResult<Data = unknown, Err = unknown> =
  | { success: true, data: Data }
  | { success: false, err: Err };

export type ChainInfo = {
  iconUrls: string[]
  nativeCurrency: {
    name: string
    symbol: string
    decimals: 18
  }
  rpcUrls: [ string]
  chainId: string
  chainName: string
};
