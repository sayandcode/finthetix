export type TrialResult<Data = unknown, Err = unknown> =
  | { success: true, data: Data }
  | { success: false, err: Err };

export type TokenDecimals = number;

export type StringifiedTokenCount = {
  value: string
  decimals: TokenDecimals
};

export type TimestampInMs = number;
