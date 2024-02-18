import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Loader2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '~/components/ui/button';
import { StringifiedTokenCount } from '~/lib/types';
import { useUnstakeCommand } from './lib/hooks';
import AmtToUnstakeSliderInput from './subcomponents/AmtToUnstakeSliderInput';
import getPercentageOfTokenCount from '~/lib/utils/getPercentageOfTokenCount';

const INIT_PERCENTAGE_TO_UNSTAKE = 1;

export function UnstakeDialogContent(
  { amtCurrentlyStaked, onClose: closeDialog }:
  {
    amtCurrentlyStaked: StringifiedTokenCount
    onClose: () => void
  }) {
  const [percentageToUnstake, setPercentageToUnstake]
    = useState(INIT_PERCENTAGE_TO_UNSTAKE);

  const amtToUnstake = useMemo(
    () => getPercentageOfTokenCount(amtCurrentlyStaked, percentageToUnstake),
    [amtCurrentlyStaked, percentageToUnstake]);

  const { unstake, isProcessing: isUnstakingInProcess }
    = useUnstakeCommand(amtToUnstake.value, closeDialog);

  const isUnstakingBlocked = isUnstakingInProcess;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Unstake</DialogTitle>
        <DialogDescription>
          Return FST tokens to your account balance
        </DialogDescription>
      </DialogHeader>
      <AmtToUnstakeSliderInput
        amtToUnstake={amtToUnstake}
        percentageToUnstake={percentageToUnstake}
        setPercentageToUnstake={setPercentageToUnstake}
        disabled={isUnstakingBlocked}
      />
      <DialogFooter className="gap-y-2">
        <Button onClick={unstake} disabled={isUnstakingBlocked}>
          {isUnstakingInProcess ? <Loader2Icon className="animate-spin" /> : 'Confirm' }
        </Button>
        <Button variant="outline" onClick={closeDialog} disabled={isUnstakingBlocked}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
}
