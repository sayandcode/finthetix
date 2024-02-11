import { UI_ERRORS } from '../../../lib/ui-errors';
import { BrowserProvider } from 'ethers';
import { tryItAsync } from '../../../lib/utils';
import { ChainInfo, DappInfo, TrialResult } from '../../../lib/types';
import { ActiveAddress } from '~/redux/features/user/slice';
import FinthetixStakingContractHandler from '~/contracts/FinthetixStakingContract';

export type MetamaskInteractionError = { title: string, description: string };

export async function requestMetamaskAddress(chainInfo: ChainInfo):
Promise<
    TrialResult<ActiveAddress, MetamaskInteractionError>
  > {
  if (!window.ethereum) {
    return {
      success: false,
      err: {
        title: UI_ERRORS.ERR1,
        description: 'Please install Metamask browser extension',
      },
    };
  }

  const provider = new BrowserProvider(window.ethereum);
  const addChainsTrialResult = await tryItAsync<null>(() => provider.send('wallet_addEthereumChain', [
    chainInfo,
  ]));
  if (!addChainsTrialResult.success) {
    return {
      success: false,
      err: {
        title: UI_ERRORS.ERR2,
        description: 'Something went wrong when adding the chain',
      },
    };
  }

  const switchChainsTrialResult = await tryItAsync<null>(() => provider.send('wallet_switchEthereumChain', [
    { chainId: chainInfo.chainId },
  ]));
  if (!switchChainsTrialResult.success) {
    return {
      success: false,
      err: {
        title: UI_ERRORS.ERR4,
        description: 'Something went wrong when switching to the required chain',
      },
    };
  }

  const requestAccTrialResult = await tryItAsync<string[]>(() => provider.send('eth_requestAccounts', []));
  if (!requestAccTrialResult.success || !requestAccTrialResult.data[0]) {
    return {
      success: false,
      err: {
        title: UI_ERRORS.ERR3,
        description: 'Something went wrong when fetching the accounts',
      },
    };
  }

  const newActiveAddress = requestAccTrialResult.data[0];
  return { success: true, data: newActiveAddress };
}

/**
 * This function is different from {@link requestMetamaskAddress} in that it
 * only returns the addresses if the current site is already connected.
 * It does not attempt to connect the current site to Metamask, like
 * {@link requestMetamaskAddress} does
 */
export async function getActiveMetamaskAddress():
Promise<TrialResult<ActiveAddress, MetamaskInteractionError>> {
  if (!window.ethereum) {
    return {
      success: false,
      err: {

        title: UI_ERRORS.ERR1,
        description: 'Please install Metamask browser extension',
      },
    };
  }

  const provider = new BrowserProvider(window.ethereum);
  const fetchAccountsTrialResult = await tryItAsync<string[]>(() => provider.send('eth_accounts', []));
  if (!fetchAccountsTrialResult.success) {
    return {
      success: false,
      err: {
        title: UI_ERRORS.ERR3,
        description: 'Something went wrong when fetching the accounts',
      },
    };
  }

  const newUser = fetchAccountsTrialResult.data[0] || null;
  return { success: true, data: newUser };
}

export async function tryGetFinthetixUserInfo(dappInfo: DappInfo):
Promise<TrialResult<Awaited<ReturnType<FinthetixStakingContractHandler['getUserData']>>>> {
  if (!window.ethereum) {
    return {
      success: false,
      err: {

        title: UI_ERRORS.ERR1,
        description: 'Please install Metamask browser extension',
      },
    };
  }

  const provider = new BrowserProvider(window.ethereum);
  const fscHandler
    = await FinthetixStakingContractHandler.make(provider, dappInfo);
  const userData = await fscHandler.getUserData();
  return { success: true, data: userData };
}
