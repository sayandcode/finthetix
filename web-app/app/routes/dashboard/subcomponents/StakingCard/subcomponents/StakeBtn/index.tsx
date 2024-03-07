import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog';
import { useCallback, useState } from 'react';
import { Button } from '~/components/ui/button';
import { StakeDialogContent } from './subcomponents/StakeBtnDialogContent';
import { StringifiedTokenCount } from '~/lib/types';

export default function StakeBtn(
  { stakingTokenBal, disabled }:
  { stakingTokenBal: StringifiedTokenCount | null, disabled: boolean },
) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const closeModal = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild disabled={disabled || !stakingTokenBal}>
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
