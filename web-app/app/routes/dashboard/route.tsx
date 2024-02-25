import { MetaFunction } from '@remix-run/node';
import { useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { selectActiveAddress, selectIsUserLoading } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';
import { useLazyGetFinthetixLogDataQuery, useLazyGetFinthetixMetadataQuery, useLazyGetFinthetixUserInfoQuery } from '~/redux/services/metamask';
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
    getUserInfo,
    { data: _userInfo = null, isFetching: isFetchingUserInfo },
  ] = useLazyGetFinthetixUserInfoQuery();

  const [
    getFinthetixMetadata,
    { data: _finthetixMetadata = null,
      isFetching: isFetchingFinthetixMetadata },
  ] = useLazyGetFinthetixMetadataQuery();

  const [
    getLogData,
    { data: _logData = null, isFetching: isFetchingLogData },
  ] = useLazyGetFinthetixLogDataQuery();

  // fetch the users' info
  useEffect(() => {
    // wait for loading of user
    if (isUserLoading) return;

    //  redirect to home if user isn't logged in
    if (!activeAddress) {
      navigate('/');
      return;
    }

    // else fetch data
    getUserInfo(dappInfo);
    getFinthetixMetadata(dappInfo);
    getLogData(dappInfo);
  },
  [
    activeAddress,
    navigate,
    isUserLoading,
    getUserInfo,
    dappInfo,
    getFinthetixMetadata,
    getLogData,
  ]);

  const userInfo = isFetchingUserInfo ? null : _userInfo;
  const finthetixMetadata
    = isFetchingFinthetixMetadata ? null : _finthetixMetadata;
  const logData = isFetchingLogData ? null : _logData;

  return (
    <div className="m-4">
      <SampleTokensBanner />
      <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-x-2 mb-4">
        <StakingCard
          userInfo={userInfo}
          finthetixMetadata={finthetixMetadata}
        />
        <RewardsCard
          userInfo={userInfo}
          finthetixMetadata={finthetixMetadata}
        />
      </div>
      <UserLogDataGraph
        logData={logData}
        finthetixMetadata={finthetixMetadata}
      />
    </div>
  );
}
