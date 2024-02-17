import { Loader2Icon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '~/components/ui/card';
import { FinthetixUserData } from '~/contracts/FinthetixStakingContract';
import { StringifyBigIntsInObj } from '~/lib/types';
import { getReadableERC20TokenCount } from '~/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog';
import StakeDialog from './subcomponents/StakeDialog';

export default function StakingCard(
  { userInfo, isInfoFetching }:
  {
    userInfo?: StringifyBigIntsInObj<FinthetixUserData>
    isInfoFetching: boolean
  }) {
  const stakedAmtStr = useMemo(() => {
    if (!userInfo) return null;
    const { value: tokenCountStr, decimals } = userInfo.stakedAmt;
    return getReadableERC20TokenCount(tokenCountStr, decimals);
  }, [userInfo]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const closeModal = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  return (
    <Card className="w-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle>Staked</CardTitle>
        <CardDescription>
          The number of tokens you have currently staked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <span className="font-bold text-5xl mr-2">
          {isInfoFetching || !stakedAmtStr
            ? <Loader2Icon className="mx-10 w-10 h-10 inline-block animate-spin" />
            : stakedAmtStr}
        </span>
        <span>FST</span>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild disabled={!userInfo}>
            <Button>Stake</Button>
          </DialogTrigger>
          <DialogContent>
            {userInfo
              ? (<StakeDialog userInfo={userInfo} onClose={closeModal} />)
              : null}
          </DialogContent>
        </Dialog>
        <Button variant="outline">Unstake</Button>
      </CardFooter>
    </Card>
  );
}
