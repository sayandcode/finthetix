import { useMemo } from 'react';
import { DASHBOARD_CHART_Y_AXIS_IDS, DashboardGraphData } from './useChartOptions/lib/types';
import { ChartProps } from 'react-chartjs-2';

const FST_TOKEN_LABEL = 'Staked Amount';
const FRT_TOKEN_LABEL = 'Reward Balance';

export default function useDashboardChartData(graphData: DashboardGraphData):
ChartProps<'bar' | 'line', number[], string>['data'] {
  return useMemo(() => ({
    labels: graphData.readableTimestamps,
    datasets: [
      {
        type: 'line',
        label: FRT_TOKEN_LABEL,
        borderColor: '#d2a700d2',
        backgroundColor: '#facc1512',
        borderWidth: 2,
        fill: true,
        data: graphData.rewardAmtVals,
        yAxisID: DASHBOARD_CHART_Y_AXIS_IDS.REWARD_AMT,
      },
      {
        type: 'bar',
        label: FST_TOKEN_LABEL,
        backgroundColor: '#facc15',
        data: graphData.stakedAmtVals,
        yAxisID: DASHBOARD_CHART_Y_AXIS_IDS.STAKED_AMT,
        maxBarThickness: 50,
      },
    ],
  }), [
    graphData.readableTimestamps,
    graphData.stakedAmtVals,
    graphData.rewardAmtVals,
  ]);
}
