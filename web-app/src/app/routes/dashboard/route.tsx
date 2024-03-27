import { MetaFunction } from '@remix-run/node';
import { useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { selectActiveAddress, selectIsUserLoading, selectActiveChainId } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';
import { useLazyFinthetixStatusQuery, useLazyFetchFinthetixLogDataQuery, useLazyFetchFinthetixUserInfoQuery } from '~/redux/services/metamask';
import SampleTokensBanner from './subcomponents/SampleTokensBanner';
import StakingCard from './subcomponents/StakingCard';
import RewardsCard from './subcomponents/RewardsCard';
import UserLogDataGraph from './subcomponents/UserLogDataGraph';
import CooldownBanner from './subcomponents/CooldownBanner';
import useTimeLeftToCooldownMs from './lib/useTimeLeftToCooldownMs';
import ChainSwitcher from './subcomponents/ChainSwitcher';

export const meta: MetaFunction = () => {
  return [{ title: 'Dashboard | Finthetix', dashboard: 'View your stake and rewards' }];
};

export default function Route() {
  // remix hooks
  const navigate = useNavigate();
  const { finthetixMetadata, chainInfo } = useRootLoaderData();

  // RTK query hooks
  const [
    triggerFinthetixStatusQuery,
    { data: _finthetixStatus = null, isFetching: isFetchingFinthetixStatus },
  ]
    = useLazyFinthetixStatusQuery();
  const finthetixStatus = isFetchingFinthetixStatus ? null : _finthetixStatus;

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

  // redux state hooks
  const activeAddress = useAppSelector(selectActiveAddress);
  const isUserLoading = useAppSelector(selectIsUserLoading);
  const activeChainId = useAppSelector(selectActiveChainId);

  // convenience variables
  const chainIdForFinthetixDapp = chainInfo.chainId;
  const isUserInWrongChain = activeChainId !== chainIdForFinthetixDapp;

  // fetch the users' info
  useEffect(() => {
    // wait for loading of user
    if (isUserLoading) return;

    //  redirect to home if user isn't logged in
    if (!activeAddress) {
      navigate('/');
      return;
    }

    // don't load data until user is in correct chain
    if (isUserInWrongChain) return;

    // else fetch data
    triggerFinthetixStatusQuery(undefined, true);
    triggerFetchUserInfo(undefined, true);
    triggerFetchLogData(undefined, true);
  },
  [
    activeAddress,
    navigate,
    isUserLoading,
    isUserInWrongChain,
    triggerFetchUserInfo,
    triggerFetchLogData,
    triggerFinthetixStatusQuery,
  ]);

  const timeLeftToCooldownMs
    = useTimeLeftToCooldownMs(finthetixStatus?.cooldownAtMs);
  const isCoolingDown = timeLeftToCooldownMs > 0;

  return (
    <div className="m-4">
      <ChainSwitcher />
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
