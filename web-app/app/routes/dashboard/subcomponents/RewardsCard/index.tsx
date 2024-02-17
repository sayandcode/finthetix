import { Loader2Icon } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '~/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '~/components/ui/card';
import { FinthetixUserData } from '~/contracts/FinthetixStakingContract';
import { StringifyBigIntsInObj } from '~/lib/types';
import { getReadableERC20TokenCount } from '~/lib/utils';

export default function RewardsCard(
  { userInfo, isInfoFetching }:
  {
    userInfo?: StringifyBigIntsInObj<FinthetixUserData>
    isInfoFetching: boolean
  }) {
  const rewardAmtStr = useMemo(() => {
    if (!userInfo) return null;
    const { value: tokenCountStr, decimals } = userInfo.rewardAmt;
    return getReadableERC20TokenCount(tokenCountStr, decimals);
  }, [userInfo]);

  return (
    <Card className="w-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle>Rewards</CardTitle>
        <CardDescription>
          The number of tokens you have been rewarded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <span className="font-bold text-5xl mr-2">
          {isInfoFetching || !rewardAmtStr
            ? <Loader2Icon className="my-2 mx-5 w-16 h-16 inline-block animate-spin" />
            : rewardAmtStr}
        </span>
        <span>FRT</span>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button className="mt-auto">Claim</Button>
      </CardFooter>
    </Card>

  );
}
