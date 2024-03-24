import { HandCoinsIcon, Loader2Icon } from 'lucide-react';
import { memo, useCallback } from 'react';
import { Button } from '~/components/ui/button';
import { useRequestSampleTokensMutation } from '~/redux/services/metamask';

export default memo(function SampleTokensBanner() {
  const [requestSampleTokens, { isLoading }]
    = useRequestSampleTokensMutation();
  const claimFreeTokens = useCallback(async () => {
    await requestSampleTokens();
  }, [requestSampleTokens]);
  return (
    <div className="bg-primary p-4 my-4 flex gap-2">
      <div><HandCoinsIcon className="h-6 w-6" /></div>
      <div>
        <h2 className="text-lg font-bold">Try out Finthetix for free!</h2>
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
});
