import { StringifiedTokenCount } from '../types';

/**
 *
 * @param tokenCount The total number of tokens of which a fraction
 *  you wish to calculate
 * @param percentage The fraction of tokens you wish to calculate.
 *  This should be a whole number representing a percentage
 * @returns The number of tokens that is a percentage of the
 *  {@link tokenCount input amount}
 */
export default function getPercentageOfTokenCount(
  tokenCount: StringifiedTokenCount, percentage: number,
): StringifiedTokenCount {
  const totalBal = BigInt(tokenCount.value);
  const _amtToStake = (totalBal * BigInt(percentage)) / 100n;
  const amtToStakeVal = _amtToStake.toString();
  return {
    value: amtToStakeVal,
    decimals: tokenCount.decimals,
  };
}
