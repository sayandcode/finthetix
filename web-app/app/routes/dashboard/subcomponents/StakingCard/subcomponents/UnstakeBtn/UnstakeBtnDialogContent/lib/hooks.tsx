import { useCallback, useMemo } from 'react';
import { StringifiedTokenCount } from '~/lib/types';

export function useAmtToUnstake(
  stakedAmtBal: StringifiedTokenCount,
  percentageToUnstake: number) {
  return useMemo(() => {
    const totalBal = BigInt(stakedAmtBal.value);
    const _amtToStake = (totalBal * BigInt(percentageToUnstake)) / 100n;
    const amtToStakeVal = _amtToStake.toString();
    return {
      value: amtToStakeVal,
      decimals: stakedAmtBal.decimals,
    };
  }, [stakedAmtBal.value, stakedAmtBal.decimals, percentageToUnstake]);
}

export function useUnstakeCommand(
  amtToUnstakeStr: string, closeDialog: () => void,
) {
  const confirmUnstaking = useCallback(async () => {
    console.log(`Unstaked ${amtToUnstakeStr}`);
    closeDialog();
  }, [amtToUnstakeStr, closeDialog]);

  return { confirmUnstaking, isUnstakingInProcess: false };
}
