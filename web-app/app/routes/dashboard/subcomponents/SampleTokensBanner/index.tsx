import { HandCoinsIcon, Loader2Icon } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '~/components/ui/button';
import { useToast } from '~/components/ui/use-toast';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { getIsMetamaskInterationEndpointError, useRequestSampleTokensMutation } from '~/redux/services/metamask';

export default function SampleTokensBanner() {
  const { toast } = useToast();
  const { dappInfo } = useRootLoaderData();
  const [requestSampleTokens, { isLoading }]
    = useRequestSampleTokensMutation();
  const claimFreeTokens = useCallback(async () => {
    const request = await requestSampleTokens(dappInfo);
    let toastDetails: { variant: 'default' | 'destructive', title: string, description: string };
    if ('error' in request) {
      toastDetails = {
        variant: 'destructive',
        ...(
          getIsMetamaskInterationEndpointError(request.error)
            ? request.error.error
            : { title: 'Request failed', description: 'Could not request sample tokens' }
        ),
      };
    }
    else {
      toastDetails = {
        variant: 'default',
        title: 'Request successful',
        description: 'FST tokens have been added to your address',
      };
    }
    toast(toastDetails);
  }, [dappInfo, requestSampleTokens, toast]);
  return (
    <div className="bg-primary p-4 my-4 flex gap-2">
      <div><HandCoinsIcon className="h-6 w-6" /></div>
      <div>
        <h2 className="text-xl font-bold">Try out Finthetix for free!</h2>
        <p>
          Claim your sample FST tokens to see how it works and get started
          with staking immediately
        </p>
      </div>
      <Button
        variant="secondary"
        className="ml-auto self-center"
        onClick={claimFreeTokens}
        disabled={isLoading}
      >
        {isLoading ? <Loader2Icon className="animate-spin" /> : 'Claim free tokens' }
      </Button>
    </div>
  );
}
