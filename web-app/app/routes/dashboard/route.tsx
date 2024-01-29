import { useNavigate, useRouteLoaderData } from '@remix-run/react';
import { BrowserProvider, formatEther } from 'ethers';
import { Loader2Icon } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { useToast } from '~/components/ui/use-toast';
import FinthetixStakingContractHandler from '~/contracts/FinthetixStakingContract';
import { AuthContext } from '~/lib/react-context/AuthContext';
import { UI_ERRORS } from '~/lib/ui-errors';
import { ROUTE_PATH as ROOT_ROUTE_PATH, loader as rootLoader } from '~/root';

type UserData = {
  stakedAmt: bigint
};

export default function Route() {
  const [isInfoLoading, setIsInfoLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { user, isLoading } = useContext(AuthContext);
  const { toast } = useToast();
  const navigate = useNavigate();
  const data = useRouteLoaderData<typeof rootLoader>(ROOT_ROUTE_PATH);
  if (!data)
    throw new Error(
      `${ROOT_ROUTE_PATH} loader not available in parent of this component`,
    );

  // fetch the users's staked info
  useEffect(() => {
    // don't need to run if key dependencies aren't available
    if (!navigate || !toast || isLoading) return;

    //  redirect to home if user isn't logged in
    if (!user) {
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
      = new FinthetixStakingContractHandler(provider, data.dappInfo);
    fscHandler.getUserData()
      .then((userData) => { setUserData(userData); })
      .finally(() => setIsInfoLoading(false));
  }, [user, data.dappInfo, navigate, toast, isLoading]);

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
