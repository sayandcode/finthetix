import { useCallback, useMemo } from 'react';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { StringifiedTokenCount } from '~/lib/types';
import { useStakeWithFinthetixMutation } from '~/redux/services/metamask';

export function useAmtToStake(
  stakingTokenBal: StringifiedTokenCount,
  percentageToStake: number) {
  return useMemo(() => {
    const totalBal = BigInt(stakingTokenBal.value);
    const _amtToStake = (totalBal * BigInt(percentageToStake)) / 100n;
    const amtToStakeVal = _amtToStake.toString();
    return {
      value: amtToStakeVal,
      decimals: stakingTokenBal.decimals,
    };
  }, [stakingTokenBal.value, stakingTokenBal.decimals, percentageToStake]);
}

export function useStakeCommand(
  amtToStakeStr: string, closeDialog: () => void,
) {
  const [
    stakeWithFinthetix,
    { isLoading: isStakingInProcess },
  ] = useStakeWithFinthetixMutation();

  const { dappInfo } = useRootLoaderData();

  const confirmStaking = useCallback(async () => {
    const stakingTrial = await stakeWithFinthetix({ amtToStakeStr, dappInfo });
    const isStakingSuccessful = 'data' in stakingTrial;
    if (isStakingSuccessful) closeDialog();
  }, [amtToStakeStr, closeDialog, dappInfo, stakeWithFinthetix]);

  return { confirmStaking, isStakingInProcess };
}
