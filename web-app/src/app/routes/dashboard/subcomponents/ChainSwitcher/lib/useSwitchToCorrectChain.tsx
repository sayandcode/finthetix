import { useCallback, useState } from 'react';
import { useRequestMetamaskAddressMutation } from '~/redux/services/metamask';

export default function useSwitchToCorrectChain() {
  const [requestMetamaskAddress] = useRequestMetamaskAddressMutation();
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const switchToCorrectChain = useCallback(async () => {
    setIsSwitchingChain(true);
    await requestMetamaskAddress();
    setIsSwitchingChain(false);
  }, [requestMetamaskAddress]);

  return { switchToCorrectChain, isSwitchingChain };
}
