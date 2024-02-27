import {
  Chart as ChartJS,
  CategoryScale,
  BarController,
  LinearScale,
  BarElement,
  Tooltip,
  LineController,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { FinthetixMetadata } from '~/contracts/FinthetixStakingContract';
import EmptyChartDatasetMsg from './subcomponents/EmptyChartDatasetMsg';
import useChartOptions from './lib/useChartOptions';
import { DashboardGraphData } from './lib/useChartOptions/lib/types';
import useChartData from './lib/useChartData';

const MAX_ALLOWED_DECIMALS_IN_LABELS = 4;
ChartJS.register(
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  Tooltip,
  LineController,
  PointElement,
  LineElement,
  Filler,
);

export default function StakeAndRewardAmtGraphs(
  { graphData, finthetixMetadata }:
  { graphData: DashboardGraphData, finthetixMetadata: FinthetixMetadata },
) {
  const data = useChartData(graphData);
  const options = useChartOptions(
    finthetixMetadata, MAX_ALLOWED_DECIMALS_IN_LABELS,
  );

  const isDatasetEmpty = graphData.readableTimestamps.length === 0;

  return (
    <div className="w-full h-72 bg-white shadow-sm px-4 py-6 relative flex justify-center items-center">
      {isDatasetEmpty ? <div className="absolute "><EmptyChartDatasetMsg /></div> : null}
      <Chart type="line" data={data} options={options} />
    </div>
  );
}
