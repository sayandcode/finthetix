import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { StringifiedTokenCount } from '~/lib/types';
import { useUnstakeCommand } from './lib/hooks';
import TokenAmtSliderInput from '~/routes/dashboard/subcomponents/lib/TokenAmtSliderInput';

export function UnstakeDialogContent(
  { amtCurrentlyStaked, onClose: closeDialog }:
  { amtCurrentlyStaked: StringifiedTokenCount, onClose: () => void }) {
  const [amtToUnstake, setAmtToUnstake] = useState(amtCurrentlyStaked);

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
      <TokenAmtSliderInput
        onAmtChange={setAmtToUnstake}
        maxAmt={amtCurrentlyStaked}
        tokenSymbol="FST"
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
