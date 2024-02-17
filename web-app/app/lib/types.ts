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

export type DappInfo = {
  stakingContractAddr: string
  stakingTokenAddr: string
  rewardTokenAddr: string
};

/**
 * We can use this type to stringify all bigints in an object,
 * so that redux can properly serialize them
 */
export type StringifyBigIntsInObj<Obj> = {
  [K in keyof Obj]:
  Obj[K] extends bigint
    ? string
    : Obj[K] extends object
      ? StringifyBigIntsInObj<Obj[K]>
      : Obj[K]
};
