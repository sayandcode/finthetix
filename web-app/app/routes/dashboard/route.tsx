import { MetaFunction } from '@remix-run/node';
import { useNavigate } from '@remix-run/react';
import { Loader2Icon } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '~/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '~/components/ui/card';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { selectActiveAddress, selectIsUserLoading } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';
import { useGetFinthetixUserInfoQuery } from '~/redux/services/metamask';

export const meta: MetaFunction = () => {
  return [{ title: 'Dashboard | Finthetix', dashboard: 'View your stake and rewards' }];
};

export default function Route() {
  const activeAddress = useAppSelector(selectActiveAddress);
  const isUserLoading = useAppSelector(selectIsUserLoading);
  const navigate = useNavigate();
  const { dappInfo } = useRootLoaderData();
  const { data: userInfo, isFetching: isInfoFetching }
    = useGetFinthetixUserInfoQuery(dappInfo);

  // fetch the users's staked info
  useEffect(() => {
    // wait for key dependencies and loading of user
    if (!navigate || isUserLoading) return;

    //  redirect to home if user isn't logged in
    if (!activeAddress) {
      navigate('/');
      return;
    }
  }, [activeAddress, navigate, isUserLoading]);

  return (
    <div className="m-4">
      {/* Staked Card */}
      <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-x-2">
        <Card className="w-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Staked</CardTitle>
            <CardDescription>
              The number of tokens you have currently staked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="font-bold text-5xl mr-2">
              {isInfoFetching || !userInfo
                ? <Loader2Icon className="my-2 mx-5 w-16 h-16 inline-block animate-spin" />
                : userInfo.stakedAmt}
            </span>
            <span>FST</span>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button>Stake</Button>
            <Button variant="outline">Unstake</Button>
          </CardFooter>
        </Card>

        {/* Rewards Card */}
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
      </div>
    </div>
  );
}
