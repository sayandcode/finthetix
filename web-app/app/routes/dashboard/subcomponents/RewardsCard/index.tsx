import { Loader2Icon } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '~/components/ui/card';
import FinthetixStakingContractHandler from '~/contracts/FinthetixStakingContract';

export default function RewardsCard(
  { userInfo, isInfoFetching }:
  {
    userInfo?: Awaited<ReturnType<FinthetixStakingContractHandler['getUserData']>>
    isInfoFetching: boolean
  }) {
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
          {isInfoFetching || !userInfo
            ? <Loader2Icon className="my-2 mx-5 w-16 h-16 inline-block animate-spin" />
            : userInfo.rewardAmt}
        </span>
        <span>FRT</span>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button className="mt-auto">Claim</Button>
      </CardFooter>
    </Card>

  );
}
