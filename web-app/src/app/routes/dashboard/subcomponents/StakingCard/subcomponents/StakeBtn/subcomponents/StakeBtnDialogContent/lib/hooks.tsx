import { useCallback } from 'react';
import { useStakeWithFinthetixMutation } from '~/redux/services/metamask';

export function useStakeCommand(
  amtToStakeStr: string, closeDialog: () => void,
) {
  const [stakeWithFinthetix, { isLoading }] = useStakeWithFinthetixMutation();

  const stake = useCallback(async () => {
    const stakingTrial = await stakeWithFinthetix({ amtToStakeStr });
    const isSuccessful = 'data' in stakingTrial;
    if (isSuccessful) closeDialog();
  }, [amtToStakeStr, closeDialog, stakeWithFinthetix]);

  return { stake, isProcessing: isLoading };
}
