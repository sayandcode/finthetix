import { Loader2Icon } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { selectIsUserLoggedIn } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';
import { useLazyGetFinthetixLogDataQuery } from '~/redux/services/metamask';
import getGraphDataFromLogData from './lib/getGraphDataFromLogData';
import StakeAndRewardAmtGraphs from './subcomponents/StakeAndRewardAmtGraphs';

export default function UserLogDataGraph() {
  const isUserLoggedIn = useAppSelector(selectIsUserLoggedIn);
  const { dappInfo } = useRootLoaderData();
  const [getLogData, { data, isFetching }] = useLazyGetFinthetixLogDataQuery();

  const graphData = useMemo(() => {
    if (!data) return null;
    const { stakedAmt, rewardAmt } = data;
    return getGraphDataFromLogData(
      stakedAmt.historicalData,
      rewardAmt.historicalData,
    );
  }, [data]);

  useEffect(() => {
    if (!isUserLoggedIn) return;

    getLogData(dappInfo);
  }, [isUserLoggedIn, getLogData, dappInfo]);

  if (isFetching || isFetching === undefined) return (
    <div className="w-full h-72 flex justify-center items-center bg-white shadow-sm">
      <Loader2Icon className="animate-spin h-10 w-10" />
    </div>
  );

  if (!graphData) return null;

  return <StakeAndRewardAmtGraphs graphData={graphData} />;
}
