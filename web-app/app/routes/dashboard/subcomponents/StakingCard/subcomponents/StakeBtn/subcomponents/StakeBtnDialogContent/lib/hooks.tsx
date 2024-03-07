import { useCallback } from 'react';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { useStakeWithFinthetixMutation } from '~/redux/services/metamask';

export function useStakeCommand(
  amtToStakeStr: string, closeDialog: () => void,
) {
  const [stakeWithFinthetix, { isLoading }] = useStakeWithFinthetixMutation();

  const { dappInfo } = useRootLoaderData();

  const stake = useCallback(async () => {
    const stakingTrial = await stakeWithFinthetix({ amtToStakeStr, dappInfo });
    const isSuccessful = 'data' in stakingTrial;
    if (isSuccessful) closeDialog();
  }, [amtToStakeStr, closeDialog, dappInfo, stakeWithFinthetix]);

  return { stake, isProcessing: isLoading };
}
