import { Loader2Icon } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { selectIsUserLoggedIn } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';
import { useLazyGetFinthetixLogDataQuery, useLazyGetFinthetixMetadataQuery } from '~/redux/services/metamask';
import getGraphDataFromLogData from './lib/getGraphDataFromLogData';
import StakeAndRewardAmtGraphs from './subcomponents/StakeAndRewardAmtGraphs';

export default function UserLogDataGraph() {
  const isUserLoggedIn = useAppSelector(selectIsUserLoggedIn);
  const { dappInfo } = useRootLoaderData();
  const [getLogData, { data: logData, isFetching: isFetchingLogData = false }]
    = useLazyGetFinthetixLogDataQuery();
  const [
    getFinthetixMetadata,
    { data: finthetixMetadata, isFetching: isFetchingMetadata = false },
  ] = useLazyGetFinthetixMetadataQuery();

  const graphData = useMemo(() => {
    if (!logData) return null;

    const { stakedAmt, rewardAmt } = logData;
    return getGraphDataFromLogData(stakedAmt, rewardAmt);
  }, [logData]);

  useEffect(() => {
    if (!isUserLoggedIn) return;

    getLogData(dappInfo);
    getFinthetixMetadata(dappInfo);
  }, [isUserLoggedIn, getLogData, getFinthetixMetadata, dappInfo]);

  if (isFetchingLogData || isFetchingMetadata) return (
    <div className="w-full h-72 flex justify-center items-center bg-white shadow-sm">
      <Loader2Icon className="animate-spin h-10 w-10" />
    </div>
  );

  if (!(graphData && finthetixMetadata)) return null;

  return (
    <StakeAndRewardAmtGraphs
      graphData={graphData}
      finthetixMetadata={finthetixMetadata}
    />
  );
}
