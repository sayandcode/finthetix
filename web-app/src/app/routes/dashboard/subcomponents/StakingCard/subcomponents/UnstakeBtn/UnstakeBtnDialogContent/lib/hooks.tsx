import { useCallback } from 'react';
import { useUnstakeWithFinthetixMutation } from '~/redux/services/metamask';

export function useUnstakeCommand(
  amtToUnstakeStr: string, closeDialog: () => void,
) {
  const [unstakeWithFinthetix, { isLoading }]
    = useUnstakeWithFinthetixMutation();
  const unstake = useCallback(async () => {
    const unstakingTrial
      = await unstakeWithFinthetix({ amtToUnstakeStr });
    const isSuccessful = 'data' in unstakingTrial;
    if (isSuccessful) closeDialog();
  }, [amtToUnstakeStr, closeDialog, unstakeWithFinthetix]);

  return { unstake, isProcessing: isLoading };
}
