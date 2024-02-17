import { Loader2Icon } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '~/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '~/components/ui/card';
import { FinthetixUserData } from '~/contracts/FinthetixStakingContract';
import { StringifyBigIntsInObj } from '~/lib/types';
import { getReadableERC20TokenCount } from '~/lib/utils';

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
            ? <Loader2Icon className="my-2 mx-5 w-16 h-16 inline-block animate-spin" />
            : stakedAmtStr}
        </span>
        <span>FST</span>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button>Stake</Button>
        <Button variant="outline">Unstake</Button>
      </CardFooter>
    </Card>
  );
}
