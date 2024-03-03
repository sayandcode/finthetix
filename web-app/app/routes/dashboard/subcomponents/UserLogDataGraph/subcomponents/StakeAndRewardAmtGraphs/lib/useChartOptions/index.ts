import { FinthetixMetadata } from '~/contracts/FinthetixStakingContract';
import useTooltipLabelFormatter from './lib/useTooltipLabelFormatter';
import { ChartProps } from 'react-chartjs-2';
import useStakedAmtTickFormatter from './lib/useStakedAmtTickFormatter';
import useRewardAmtTickFormatter from './lib/useRewardAmtTickFormatter';
import { useMemo } from 'react';
import { DASHBOARD_CHART_Y_AXIS_IDS } from './lib/types';
import { StringifyBigIntsInObj } from '~/lib/utils/stringifyBigIntsInObj';

export default function useDashboardChartOptions(
  finthetixMetadata: StringifyBigIntsInObj<FinthetixMetadata>,
  maxAllowedDecimalsInLabels: number,
): ChartProps<'bar' | 'line', number[], string>['options'] {
  const stakingTokenDecimals = finthetixMetadata.stakingToken.decimals;
  const rewardTokenDecimals = finthetixMetadata.rewardToken.decimals;
  const stakingTokenSymbol = finthetixMetadata.stakingToken.symbol;
  const rewardTokenSymbol = finthetixMetadata.rewardToken.symbol;

  const tooltipLabelFormatter = useTooltipLabelFormatter({
    stakingTokenDecimals,
    rewardTokenDecimals,
    stakingTokenSymbol,
    rewardTokenSymbol,
    maxAllowedDecimalsInLabels,
  });
  const stakedAmtTickFormatter = useStakedAmtTickFormatter(
    stakingTokenDecimals, maxAllowedDecimalsInLabels,
  );

  const rewardAmtTickFormatter = useRewardAmtTickFormatter(
    rewardTokenDecimals, maxAllowedDecimalsInLabels,
  );

  return useMemo(() => ({
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: true,
        intersect: false,
        mode: 'index',
        callbacks: {
          label: tooltipLabelFormatter,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      [DASHBOARD_CHART_Y_AXIS_IDS.STAKED_AMT]: {
        type: 'linear',
        display: true,
        position: 'left',
        grace: '5%',
        ticks: { callback: stakedAmtTickFormatter },
      },
      [DASHBOARD_CHART_Y_AXIS_IDS.REWARD_AMT]: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grace: '2.5%',
        ticks: { callback: rewardAmtTickFormatter },
      },
    },
  }), [tooltipLabelFormatter, stakedAmtTickFormatter, rewardAmtTickFormatter]);
}
