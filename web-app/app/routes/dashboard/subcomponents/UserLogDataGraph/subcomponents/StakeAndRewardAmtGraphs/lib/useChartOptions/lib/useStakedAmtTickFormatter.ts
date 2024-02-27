import { useCallback } from 'react';
import getReadableERC20TokenCount from '~/lib/utils/readableERC20';
import { TickFormatterFn, stakedAmtValSchema } from './types';
import { TokenDecimals } from '~/lib/types';

export default function useStakedAmtTickFormatter(
  stakingTokenDecimals: TokenDecimals, maxAllowedDecimalsInLabels: number,
): TickFormatterFn {
  return useCallback((tickVal) => {
    const typedTickVal = stakedAmtValSchema.parse(tickVal);
    const tokenCountValStr = Intl.NumberFormat('en-US', { useGrouping: false }).format(Math.floor(typedTickVal));

    return typedTickVal < 1
      ? typedTickVal
      : getReadableERC20TokenCount({
        value: tokenCountValStr,
        decimals: stakingTokenDecimals,
      }, maxAllowedDecimalsInLabels);
  }, [stakingTokenDecimals, maxAllowedDecimalsInLabels]);
}
