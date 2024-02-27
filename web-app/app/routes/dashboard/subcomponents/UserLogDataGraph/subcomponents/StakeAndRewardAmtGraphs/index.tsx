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
import getGraphDataFromLogData from '../../lib/getGraphDataFromLogData';
import getReadableERC20TokenCount from '~/lib/utils/readableERC20';
import { z } from 'zod';
import { FinthetixMetadata } from '~/contracts/FinthetixStakingContract';

type GraphData = ReturnType<typeof getGraphDataFromLogData>;

const MAX_DECIMALS_IN_LABELS = 4;
const FST_TOKEN_LABEL = 'Staked Amount';
const FRT_TOKEN_LABEL = 'Reward Balance';

enum Y_AXIS_IDS {
  REWARD_AMT = 'rewardAmt',
  STAKED_AMT = 'stakedAmt',
}

const stakedAmtValSchema = z.number() satisfies z.ZodType<GraphData['stakedAmtVals'][number]>;
const rewardAmtValSchema = z.number() satisfies z.ZodType<GraphData['stakedAmtVals'][number]>;
const graphYValsSchema = z.union([stakedAmtValSchema, rewardAmtValSchema]);

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
  {
    graphData: GraphData
    finthetixMetadata: FinthetixMetadata
  },
) {
  const isDatasetEmpty = graphData.readableTimestamps.length === 0;
  return (
    <div className="w-full h-72 bg-white shadow-sm px-4 py-6 relative flex justify-center items-center">
      {isDatasetEmpty
        ? (
          <div className="absolute text-center mx-20">
            <span className="text-xl font-bold">No data available.</span>
            <br />
            <span>Interact with the contract to see data</span>
          </div>
          )
        : null}

      <Chart
        type="line"
        data={{
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
              yAxisID: Y_AXIS_IDS.REWARD_AMT,
            },
            {
              type: 'bar',
              label: FST_TOKEN_LABEL,
              backgroundColor: '#facc15',
              data: graphData.stakedAmtVals,
              yAxisID: Y_AXIS_IDS.STAKED_AMT,
              maxBarThickness: 50,
            },
          ],
        }}
        options={{
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              enabled: true,
              intersect: false,
              mode: 'index',
              callbacks: {
                label: (ctx) => {
                  const { yAxisID } = ctx.dataset;
                  if (!getIsValidYAxisID(yAxisID)) throw new Error('`yAxisID` is required to format tooltip label');

                  const decimals = ({
                    [Y_AXIS_IDS.STAKED_AMT]:
                      finthetixMetadata.stakingToken.decimals,
                    [Y_AXIS_IDS.REWARD_AMT]:
                      finthetixMetadata.rewardToken.decimals,
                  } as const)[yAxisID];

                  const rawVal = ctx.raw;
                  const typedRawVal = graphYValsSchema.parse(rawVal);

                  const readableCount = getReadableERC20TokenCount({
                    value: Intl.NumberFormat('en-US', { useGrouping: false }).format(typedRawVal),
                    decimals,
                  }, MAX_DECIMALS_IN_LABELS);

                  const tokenSymbol = ({
                    [Y_AXIS_IDS.STAKED_AMT]:
                      finthetixMetadata.stakingToken.symbol,
                    [Y_AXIS_IDS.REWARD_AMT]:
                      finthetixMetadata.rewardToken.symbol,
                  } as const)[yAxisID];

                  const label = ctx.dataset.label;
                  if (!label) throw new Error('Graph dataset must have label');

                  return `${label}: ${readableCount} ${tokenSymbol}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
            },
            stakedAmt: {
              type: 'linear',
              display: true,
              position: 'left',
              grace: '5%',
              ticks: {
                callback: (tickVal) => {
                  const typedTickVal = stakedAmtValSchema.parse(tickVal);
                  return typedTickVal < 1
                    ? typedTickVal
                    : getReadableERC20TokenCount({
                      value: Intl.NumberFormat('en-US', { useGrouping: false }).format(Math.floor(typedTickVal)),
                      decimals: finthetixMetadata.stakingToken.decimals,
                    }, MAX_DECIMALS_IN_LABELS);
                }
                ,
              },
            },
            rewardAmt: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              grace: '2.5%',
              ticks: {
                callback: (tickVal) => {
                  const typedTickVal = rewardAmtValSchema.parse(tickVal);
                  return typedTickVal < 1
                    ? typedTickVal
                    : getReadableERC20TokenCount({
                      value: Intl.NumberFormat('en-US', { useGrouping: false }).format(Math.floor(typedTickVal)),
                      decimals: finthetixMetadata.rewardToken.decimals,
                    }, MAX_DECIMALS_IN_LABELS);
                },
              },
            },
          },
        }}
      />

    </div>
  );
}

function getIsValidYAxisID(str: string | undefined): str is Y_AXIS_IDS {
  if (!str) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values(Y_AXIS_IDS).includes(str as any);
}
