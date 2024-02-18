import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import InsufficientTokenBalAlert from './subcomponents/InsufficientTokensAlert';
import { StringifiedTokenCount } from '~/lib/types';
import { useStakeCommand } from './lib/hooks';
import TokenAmtSliderInput from '~/routes/dashboard/subcomponents/lib/TokenAmtSliderInput';

export function StakeDialogContent(
  { stakingTokenBal, onClose: closeDialog }:
  { stakingTokenBal: StringifiedTokenCount, onClose: () => void }) {
  const [amtToStake, setAmtToStake] = useState(stakingTokenBal);

  const { stake, isProcessing: isStakingInProcess }
    = useStakeCommand(amtToStake.value, closeDialog);

  const isTokenBalInsufficient = stakingTokenBal.value === '0';
  const isStakingBlocked = isTokenBalInsufficient || isStakingInProcess;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Stake</DialogTitle>
        <DialogDescription>
          Earn more rewards by staking more FST tokens
        </DialogDescription>
      </DialogHeader>
      {isTokenBalInsufficient ? <InsufficientTokenBalAlert /> : null}
      <TokenAmtSliderInput
        onAmtChange={setAmtToStake}
        maxAmt={stakingTokenBal}
        tokenSymbol="FST"
        disabled={isStakingBlocked}
      />
      <DialogFooter className="gap-y-2">
        <Button onClick={stake} disabled={isStakingBlocked}>
          {isStakingInProcess ? <Loader2Icon className="animate-spin" /> : 'Confirm' }
        </Button>
        <Button variant="outline" onClick={closeDialog} disabled={isStakingBlocked}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
}
