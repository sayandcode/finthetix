import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import InsufficientTokenBalAlert from './subcomponents/InsufficientTokensAlert';
import { StringifiedTokenCount } from '~/lib/types';
import { useAmtToStake, useStakeCommand } from './lib/hooks';
import AmtToStakeSliderInput from './subcomponents/AmtToStakeSliderInput';

const INIT_PERCENTAGE_TO_STAKE = 100;

export function StakeDialogContent(
  { stakingTokenBal, onClose: closeDialog }:
  {
    stakingTokenBal: StringifiedTokenCount
    onClose: () => void
  }) {
  const [percentageToStake, setPercentageToStake]
    = useState(INIT_PERCENTAGE_TO_STAKE);

  const amtToStake = useAmtToStake(stakingTokenBal, percentageToStake);

  const { confirmStaking, isStakingInProcess }
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
      <AmtToStakeSliderInput
        amtToStake={amtToStake}
        percentageToStake={percentageToStake}
        setPercentageToStake={setPercentageToStake}
        disabled={isStakingBlocked}
      />
      <DialogFooter className="gap-y-2">
        <Button onClick={confirmStaking} disabled={isStakingBlocked}>
          {isStakingInProcess ? <Loader2Icon className="animate-spin" /> : 'Confirm' }
        </Button>
        <Button variant="outline" onClick={closeDialog} disabled={isStakingBlocked}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
}
