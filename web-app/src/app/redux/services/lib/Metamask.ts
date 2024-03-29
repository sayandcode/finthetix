import { BrowserProvider } from 'ethers';
import { z } from 'zod';
import { ChainInfo } from '~/lib/loaders/chainInfo/schema';
import tryItAsync from '~/lib/utils/tryItAsync';
import { ActiveAddress } from '~/redux/features/user/slice';

enum MetamaskHandlerErrors {
  ERR1 = 'Metamask not installed',
  ERR2 = 'No account found in Metamask',
}

const USER_REJECT_ERR_CODE = 'ACTION_REJECTED';
const metamaskRejectedErrSchema = z.object({
  code:
    z.string()
      .refine(errCode => errCode === USER_REJECT_ERR_CODE,
        `Error code is not '${USER_REJECT_ERR_CODE}'`),
});

export default class MetamaskHandler {
  public readonly provider: BrowserProvider;
  public readonly ethereum: NonNullable<typeof window.ethereum>;

  constructor() {
    if (!window.ethereum) {
      throw new Error(MetamaskHandlerErrors.ERR1);
    }
    this.ethereum = window.ethereum;
    this.provider = new BrowserProvider(window.ethereum);
  }

  async requestAddress(chainInfo: ChainInfo):
  Promise<NonNullable<ActiveAddress>> {
    // try to use user's RPC if it exists (less friction)
    const switchTrial = await tryItAsync(
      () => this.provider.send('wallet_switchEthereumChain', [{ chainId: chainInfo.chainId }]));
    if (!switchTrial.success) {
      const { success: isErrBecauseOfUserRejectingSwitchChain }
        = metamaskRejectedErrSchema.safeParse(switchTrial.err);
      if (isErrBecauseOfUserRejectingSwitchChain) throw new Error('User rejected switching to previously added network');

      // else give the option of using our RPC server
      await this.provider.send('wallet_addEthereumChain', [chainInfo]);

      // next line will only give a prompt if user rejected the 'switch-network'
      // as part of 'add-chain'. This additional prompt helps to stop the flow
      // if user is not on correct network
      await this.provider.send('wallet_switchEthereumChain', [{ chainId: chainInfo.chainId }]);
    }

    const accounts: string[] = await this.provider.send('eth_requestAccounts', []);
    if (!accounts[0]) throw new Error(MetamaskHandlerErrors.ERR2);
    return accounts[0];
  }

  /**
 * This function is different from {@link requestAddress} in that it
 * only returns the addresses if the current site is already connected.
 * It does not attempt to connect the current site to Metamask, like
 * {@link requestAddress} does
 */
  async getActiveAddress(): Promise<ActiveAddress> {
    const accounts = await this.provider.send('eth_accounts', []);
    const activeAddress = accounts[0] || null;
    return activeAddress;
  }

  async getActiveChainId(): Promise<ChainInfo['chainId']> {
    const chainId = await this.provider.send('eth_chainId', []);
    return chainId;
  }
}
