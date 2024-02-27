import { TokenDecimals } from '~/lib/types';
import { TickFormatterFn, rewardAmtValSchema } from './types';
import { useCallback } from 'react';
import getReadableERC20TokenCount from '~/lib/utils/readableERC20';

export default function useRewardAmtTickFormatter(
  rewardTokenDecimals: TokenDecimals, maxAllowedDecimalsInLabels: number,
): TickFormatterFn {
  return useCallback((tickVal) => {
    const typedTickVal = rewardAmtValSchema.parse(tickVal);
    return typedTickVal < 1
      ? typedTickVal
      : getReadableERC20TokenCount({
        value: Intl.NumberFormat('en-US', { useGrouping: false }).format(Math.floor(typedTickVal)),
        decimals: rewardTokenDecimals,
      }, maxAllowedDecimalsInLabels);
  }, [rewardTokenDecimals, maxAllowedDecimalsInLabels]);
}
