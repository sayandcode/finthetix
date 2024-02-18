import { useCallback } from 'react';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { useUnstakeWithFinthetixMutation } from '~/redux/services/metamask';

export function useUnstakeCommand(
  amtToUnstakeStr: string, closeDialog: () => void,
) {
  const [unstakeWithFinthetix, { isLoading }]
    = useUnstakeWithFinthetixMutation();
  const { dappInfo } = useRootLoaderData();
  const unstake = useCallback(async () => {
    const unstakingTrial
      = await unstakeWithFinthetix({ amtToUnstakeStr, dappInfo });
    const isSuccessful = 'data' in unstakingTrial;
    if (isSuccessful) closeDialog();
  }, [amtToUnstakeStr, closeDialog, dappInfo, unstakeWithFinthetix]);

  return { unstake, isProcessing: isLoading };
}
