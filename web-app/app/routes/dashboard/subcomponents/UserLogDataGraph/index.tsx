import { Loader2Icon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { FinthetixLogDataQueryResult } from '~/redux/services/metamask';
import getGraphDataFromLogData from './lib/getGraphDataFromLogData';
import StakeAndRewardAmtGraphs from './subcomponents/StakeAndRewardAmtGraphs';
import { FinthetixMetadata } from '~/contracts/FinthetixStakingContract';
import { type WithStringifiedBigints } from '~/lib/utils/stringifyBigIntsInObj';

export default memo(function UserLogDataGraph(
  { logData, finthetixMetadata }:
  {
    logData: FinthetixLogDataQueryResult | null
    finthetixMetadata: WithStringifiedBigints<FinthetixMetadata>
  },
) {
  const graphData = useMemo(() => {
    if (!logData) return null;

    const { stakedAmt, rewardAmt } = logData;
    return getGraphDataFromLogData(stakedAmt, rewardAmt);
  }, [logData]);

  if (!(graphData && finthetixMetadata)) return (
    <div className="w-full h-72 flex justify-center items-center bg-white shadow-sm">
      <Loader2Icon className="animate-spin h-10 w-10" />
    </div>
  );

  return (
    <StakeAndRewardAmtGraphs
      graphData={graphData}
      finthetixMetadata={finthetixMetadata}
    />
  );
});
