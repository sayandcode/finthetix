import { MetaFunction } from '@remix-run/node';
import { useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { selectActiveAddress, selectIsUserLoading } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';
import { useLazyFetchFinthetixLogDataQuery, useLazyFetchFinthetixUserInfoQuery } from '~/redux/services/metamask';
import SampleTokensBanner from './subcomponents/SampleTokensBanner';
import StakingCard from './subcomponents/StakingCard';
import RewardsCard from './subcomponents/RewardsCard';
import UserLogDataGraph from './subcomponents/UserLogDataGraph';
import CooldownBanner from './subcomponents/CooldownBanner';
import useTimeLeftToCooldownMs from './lib/useTimeLeftToCooldownMs';

export const meta: MetaFunction = () => {
  return [{ title: 'Dashboard | Finthetix', dashboard: 'View your stake and rewards' }];
};

export default function Route() {
  // dummy value. Will need to be fetched from backend
  const cooldownAtMs = 1709604883105;

  const { dappInfo, finthetixMetadata } = useRootLoaderData();
  const [
    triggerFetchUserInfo,
    { data: _userInfo = null, isFetching: isFetchingUserInfo },
  ] = useLazyFetchFinthetixUserInfoQuery();
  const userInfo = isFetchingUserInfo ? null : _userInfo;

  const [
    triggerFetchLogData,
    { data: _logData = null, isFetching: isFetchingLogData },
  ] = useLazyFetchFinthetixLogDataQuery();
  const logData = isFetchingLogData ? null : _logData;

  const activeAddress = useAppSelector(selectActiveAddress);
  const isUserLoading = useAppSelector(selectIsUserLoading);
  const navigate = useNavigate();

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
    triggerFetchUserInfo(dappInfo, true);
    triggerFetchLogData(dappInfo, true);
  },
  [
    activeAddress,
    navigate,
    isUserLoading,
    triggerFetchUserInfo,
    dappInfo,
    triggerFetchLogData,
  ]);

  const timeLeftToCooldownMs = useTimeLeftToCooldownMs(cooldownAtMs);
  const isCoolingDown = timeLeftToCooldownMs > 0;

  return (
    <div className="m-4">
      <SampleTokensBanner />
      <CooldownBanner timeLeftToCooldownMs={timeLeftToCooldownMs} />
      <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-x-2 mb-4">
        <StakingCard
          disabled={isCoolingDown}
          userInfo={userInfo}
          finthetixMetadata={finthetixMetadata}
        />
        <RewardsCard
          disabled={isCoolingDown}
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
