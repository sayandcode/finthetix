import { TokenDecimals } from '~/lib/types';
import { DASHBOARD_CHART_Y_AXIS_IDS, TooltipFormatterFn, getIsValidYAxisIDForDashboardChart, graphYValsSchema } from './types';
import { useCallback } from 'react';
import getReadableERC20TokenCount from '~/lib/utils/readableERC20';

export default function useDashboardChartTooltipLabelFormatter(
  {
    maxAllowedDecimalsInLabels,
    stakingTokenDecimals,
    rewardTokenDecimals,
    stakingTokenSymbol,
    rewardTokenSymbol,
  }: {
    maxAllowedDecimalsInLabels: number
    stakingTokenDecimals: TokenDecimals
    rewardTokenDecimals: TokenDecimals
    stakingTokenSymbol: string
    rewardTokenSymbol: string
  },
): TooltipFormatterFn {
  return useCallback((ctx) => {
    const { yAxisID } = ctx.dataset;
    if (!getIsValidYAxisIDForDashboardChart(yAxisID)) throw new Error('`yAxisID` is required to format tooltip label');

    const decimals = ({
      [DASHBOARD_CHART_Y_AXIS_IDS.STAKED_AMT]: stakingTokenDecimals,
      [DASHBOARD_CHART_Y_AXIS_IDS.REWARD_AMT]: rewardTokenDecimals,
    } as const)[yAxisID];

    const rawVal = ctx.raw;
    const typedRawVal = graphYValsSchema.parse(rawVal);

    const readableCount = getReadableERC20TokenCount({
      value: Intl.NumberFormat('en-US', { useGrouping: false }).format(typedRawVal),
      decimals,
    }, maxAllowedDecimalsInLabels);

    const tokenSymbol = ({
      [DASHBOARD_CHART_Y_AXIS_IDS.STAKED_AMT]: stakingTokenSymbol,
      [DASHBOARD_CHART_Y_AXIS_IDS.REWARD_AMT]: rewardTokenSymbol,
    } as const)[yAxisID];

    const label = ctx.dataset.label;
    if (!label) throw new Error('Graph dataset must have label');

    return `${label}: ${readableCount} ${tokenSymbol}`;
  },
  [
    stakingTokenDecimals,
    rewardTokenDecimals,
    stakingTokenSymbol,
    rewardTokenSymbol,
    maxAllowedDecimalsInLabels,
  ],
  );
}
