import { useCallback } from 'react';

export function useUnstakeCommand(
  amtToUnstakeStr: string, closeDialog: () => void,
) {
  const unstake = useCallback(async () => {
    console.log(`Unstaked ${amtToUnstakeStr}`);
    closeDialog();
  }, [amtToUnstakeStr, closeDialog]);

  return { unstake, isProcessing: false };
}
