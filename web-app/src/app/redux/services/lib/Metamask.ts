import { BrowserProvider } from 'ethers';
import { ChainInfo } from '~/lib/loaders/chainInfo/schema';
import { ActiveAddress } from '~/redux/features/user/slice';

enum MetamaskHandlerErrors {
  ERR1 = 'Metamask not installed',
  ERR2 = 'No account found in Metamask',
}
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
    await this.provider.send('wallet_addEthereumChain', [
      chainInfo,
    ]);
    await this.provider.send('wallet_switchEthereumChain', [
      { chainId: chainInfo.chainId },
    ]);
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
