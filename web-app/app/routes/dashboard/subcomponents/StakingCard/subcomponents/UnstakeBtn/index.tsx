import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog';
import { useCallback, useState } from 'react';
import { Button } from '~/components/ui/button';
import { FinthetixUserData } from '~/contracts/FinthetixStakingContract';
import { StringifyBigIntsInObj } from '~/lib/utils/stringifyBigIntsInObj';
import { UnstakeDialogContent } from './UnstakeBtnDialogContent';

export default function UnstakeBtn(
  { amtCurrentlyStaked }:
  { amtCurrentlyStaked: StringifyBigIntsInObj<FinthetixUserData>['stakedAmt'] | undefined },
) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const closeModal = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const isBtnDisabled = !amtCurrentlyStaked || amtCurrentlyStaked.value === '0';

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild disabled={isBtnDisabled}>
        <Button variant="outline">Unstake</Button>
      </DialogTrigger>
      <DialogContent>
        {!isBtnDisabled
          ? (
            <UnstakeDialogContent
              amtCurrentlyStaked={amtCurrentlyStaked}
              onClose={closeModal}
            />
            )
          : null}
      </DialogContent>
    </Dialog>
  );
}
