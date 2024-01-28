import { json, type MetaFunction } from '@remix-run/node';
import { useCallback, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { BrowserProvider } from 'ethers';
import { tryItAsync } from '~/lib/utils';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useToast } from '~/components/ui/use-toast';
import { UI_ERRORS } from '~/lib/ui-errors';
import { PARSED_PROCESS_ENV } from '~/lib/env';
import { useActiveAddress } from '~/lib/hooks/useActiveAddress';
import { Loader2Icon } from 'lucide-react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Finthetix' },
    { name: 'description', content: 'Earn rewards by staking with Finthetix' },
  ];
};

export const loader = async () => {
  const chainInfo = PARSED_PROCESS_ENV.NODE_ENV === 'development'
    ? {
        iconUrls: [],
        nativeCurrency: {
          name: 'xANV',
          symbol: 'xANV',
          decimals: 18,
        },
        rpcUrls: [
          'http://localhost:8545',
        ],
        chainId: `0x${(31337).toString(16)}`,
        chainName: 'Anvil',

      } as const
    : {};

  return json({ chainInfo });
};

export default function Index() {
  const activeAddress = useActiveAddress();
  const { chainInfo } = useLoaderData<typeof loader>();
  const { toast } = useToast();

  const handleClick = useCallback(async () => {
    if (!window.ethereum) {
      toast({
        title: UI_ERRORS.ERR1,
        description: 'Please install Metamask browser extension',
        variant: 'destructive',
      });
      return;
    }

    const provider = new BrowserProvider(window.ethereum);
    const addChainsTrialResult = await tryItAsync<null>(() => provider.send('wallet_addEthereumChain', [
      chainInfo,
    ]));
    if (!addChainsTrialResult.success) {
      toast({
        title: UI_ERRORS.ERR2,
        description: 'Something went wrong when adding the chain',
        variant: 'destructive',
      });
      return;
    }

    const requestAccTrialResult = await tryItAsync<string[]>(() => provider.send('eth_requestAccounts', []));
    if (!requestAccTrialResult.success) {
      toast({
        title: UI_ERRORS.ERR3,
        description: 'Something went wrong when fetching the accounts',
        variant: 'destructive',
      });
      return;
    }

    const newActiveAddress = requestAccTrialResult.data[0];
    activeAddress.set(newActiveAddress);
  }, [chainInfo, toast, activeAddress]);

  const navigate = useNavigate();
  const hasActiveAddress = !activeAddress.isLoading && activeAddress.get();
  useEffect(() => {
    if (hasActiveAddress) navigate('/dashboard');
  }, [hasActiveAddress, navigate]);

  return (
    <div>
      <section className="flex flex-col gap-y-2 items-center justify-center h-screen text-center">
        <h1 className="text-5xl sm:text-6xl font-bold">Finthetix</h1>
        <p className="text-xl">Earn rewards by staking tokens</p>
        <Button onClick={handleClick}>
          {activeAddress.isLoading
            ? <Loader2Icon className="animate-spin" />
            : activeAddress.get() || 'Connect Wallet'}
        </Button>
      </section>
    </div>
  );
}
