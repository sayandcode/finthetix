import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog';
import { useCallback, useState } from 'react';
import { Button } from '~/components/ui/button';
import { FinthetixUserData } from '~/contracts/FinthetixStakingContract';
import { StringifyBigIntsInObj } from '~/lib/utils/stringifyBigIntsInObj';
import { StakeDialogContent } from './subcomponents/StakeBtnDialogContent';

export default function StakeBtn(
  { stakingTokenBal }:
  { stakingTokenBal: StringifyBigIntsInObj<FinthetixUserData>['stakingTokenBal'] | undefined },
) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const closeModal = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild disabled={!stakingTokenBal}>
        <Button>Stake</Button>
      </DialogTrigger>
      <DialogContent>
        {stakingTokenBal
          ? (
            <StakeDialogContent
              stakingTokenBal={stakingTokenBal}
              onClose={closeModal}
            />
            )
          : null}
      </DialogContent>
    </Dialog>
  );
}
