import { Loader2Icon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { FinthetixLogDataQueryResult } from '~/redux/services/metamask';
import getGraphDataFromLogData from './lib/getGraphDataFromLogData';
import StakeAndRewardAmtGraphs from './subcomponents/StakeAndRewardAmtGraphs';
import { FinthetixMetadata } from '~/contracts/FinthetixStakingContract';
import { type WithStringifiedBigints } from '~/lib/utils/stringifyBigIntsInObj';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';

export default memo(function UserLogDataGraph(
  { logData, finthetixMetadata }:
  {
    logData: FinthetixLogDataQueryResult | null
    finthetixMetadata: WithStringifiedBigints<FinthetixMetadata>
  },
) {
  const { rpcQueryMaxBlockCount } = useRootLoaderData();

  const graphData = useMemo(() => {
    if (!logData) return null;

    const { stakedAmt, rewardAmt } = logData;
    return getGraphDataFromLogData(stakedAmt, rewardAmt);
  }, [logData]);

  return (
    <div className="flex flex-col w-full h-96 bg-white shadow-sm border border-black px-4 py-4">
      <div className="font-semibold text-2xl mb-4">
        Your Activity
        <span className="text-sm align-super">{` (Last ${rpcQueryMaxBlockCount} blocks)`}</span>
      </div>
      <div className="relative flex justify-center items-center h-full p-2">
        {(!(graphData && finthetixMetadata))
          ? <Loader2Icon className="animate-spin h-10 w-10" />
          : (
            <StakeAndRewardAmtGraphs
              graphData={graphData}
              finthetixMetadata={finthetixMetadata}
            />
            )}
      </div>
    </div>
  );
});
