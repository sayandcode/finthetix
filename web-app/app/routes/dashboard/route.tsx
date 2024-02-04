import { useNavigate } from '@remix-run/react';
import { BrowserProvider, formatEther } from 'ethers';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { useToast } from '~/components/ui/use-toast';
import FinthetixStakingContractHandler from '~/contracts/FinthetixStakingContract';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { UI_ERRORS } from '~/lib/ui-errors';
import { selectActiveAddress, selectIsUserLoading } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';

type UserData = {
  stakedAmt: bigint
};

export default function Route() {
  const [isInfoLoading, setIsInfoLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const activeAddress = useAppSelector(selectActiveAddress);
  const isUserLoading = useAppSelector(selectIsUserLoading);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { dappInfo } = useRootLoaderData();

  // fetch the users's staked info
  useEffect(() => {
    // wait for key dependencies and loading of user
    if (!navigate || !toast || isUserLoading) return;

    //  redirect to home if user isn't logged in
    if (!activeAddress) {
      navigate('/');
      return;
    }

    if (!window.ethereum) {
      toast({
        title: UI_ERRORS.ERR1,
        description: 'Please install Metamask browser extension',
        variant: 'destructive',
      });
      return;
    }

    setIsInfoLoading(true);
    const provider = new BrowserProvider(window.ethereum);
    const fscHandler
      = new FinthetixStakingContractHandler(provider, dappInfo);
    fscHandler.getUserData()
      .then((userData) => { setUserData(userData); })
      .finally(() => setIsInfoLoading(false));
  }, [activeAddress, dappInfo, navigate, toast, isUserLoading]);

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
          <CardContent className="flex flex-col gap-y-4">
            <div className="flex justify-between items-end gap-x-2">
              <div>
                <span className="font-bold text-7xl mr-2">
                  {isInfoLoading || !userData
                    ? <Loader2Icon className="my-2 mx-5 w-16 h-16 inline-block animate-spin" />
                    : formatEther(userData.stakedAmt)}
                </span>
                <span>FST</span>
              </div>
              <div className="flex flex-col gap-y-2">
                <Button>Stake</Button>
                <Button variant="outline">Unstake</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Card */}
        <Card className="w-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
            <CardDescription>
              The number of tokens you have been rewarded
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-4">
            <div className="flex justify-between gap-x-2">
              <div>
                <span className="font-bold text-7xl mr-2">
                  {isInfoLoading
                    ? <Loader2Icon className="my-2 mx-5 w-16 h-16 inline-block animate-spin" />
                    : 200}
                </span>
                <span>FRT</span>
              </div>
              <Button className="mt-auto">Claim</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
