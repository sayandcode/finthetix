import { MetaFunction } from '@remix-run/node';
import { useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { selectActiveAddress, selectIsUserLoading } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';
import { useLazyGetFinthetixUserInfoQuery } from '~/redux/services/metamask';
import SampleTokensBanner from './subcomponents/SampleTokensBanner';
import StakingCard from './subcomponents/StakingCard';
import RewardsCard from './subcomponents/RewardsCard';
import UserLogDataGraph from './subcomponents/UserLogDataGraph';

export const meta: MetaFunction = () => {
  return [{ title: 'Dashboard | Finthetix', dashboard: 'View your stake and rewards' }];
};

export default function Route() {
  const activeAddress = useAppSelector(selectActiveAddress);
  const isUserLoading = useAppSelector(selectIsUserLoading);
  const navigate = useNavigate();
  const { dappInfo } = useRootLoaderData();
  const [
    getFinthetixUserInfoQuery,
    { data: userInfo, isFetching: isInfoFetching },
  ] = useLazyGetFinthetixUserInfoQuery();

  // fetch the users's staked info
  useEffect(() => {
    // wait for key dependencies and loading of user
    if (!navigate || isUserLoading || !dappInfo || !getFinthetixUserInfoQuery)
      return;

    //  redirect to home if user isn't logged in
    if (!activeAddress) {
      navigate('/');
      return;
    }

    getFinthetixUserInfoQuery(dappInfo);
  },
  [
    activeAddress,
    navigate,
    isUserLoading,
    getFinthetixUserInfoQuery,
    dappInfo,
  ]);

  return (
    <div className="m-4">
      <SampleTokensBanner />
      <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-x-2 mb-4">
        <StakingCard userInfo={userInfo} isInfoFetching={isInfoFetching} />
        <RewardsCard userInfo={userInfo} isInfoFetching={isInfoFetching} />
      </div>
      <UserLogDataGraph />
    </div>
  );
}
