import { MetaFunction, json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { selectActiveAddress, selectIsUserLoading } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';
import { useLazyFetchFinthetixLogDataQuery, useLazyFetchFinthetixUserInfoQuery } from '~/redux/services/metamask';
import SampleTokensBanner from './subcomponents/SampleTokensBanner';
import StakingCard from './subcomponents/StakingCard';
import RewardsCard from './subcomponents/RewardsCard';
import UserLogDataGraph from './subcomponents/UserLogDataGraph';
import { ReadonlyFinthetixStakingContractHandler } from '~/contracts/FinthetixStakingContract';
import { getChainInfo, getDappInfo } from '~/lib/loaders';

export const meta: MetaFunction = () => {
  return [{ title: 'Dashboard | Finthetix', dashboard: 'View your stake and rewards' }];
};

export const loader = async () => {
  const chainInfo = getChainInfo();
  const dappInfo = getDappInfo();
  const fscReadonlyHandler
    = new ReadonlyFinthetixStakingContractHandler(
      chainInfo.rpcUrls[0], dappInfo,
    );
  const finthetixMetadata = await fscReadonlyHandler.getMetadata();
  return json({ finthetixMetadata });
};

export default function Route() {
  const { finthetixMetadata } = useLoaderData<typeof loader>();
  const { dappInfo } = useRootLoaderData();
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
