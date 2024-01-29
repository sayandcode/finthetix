import { BrowserProvider } from 'ethers';
import { DappInfo } from '~/lib/types';
import { FinthetixStakingContract, FinthetixStakingContract__factory } from './types';

export default class FinthetixStakingContractHandler {
  private contract: FinthetixStakingContract;

  constructor(provider: BrowserProvider, dappInfo: DappInfo) {
    this.contract
      = FinthetixStakingContract__factory.connect(
        dappInfo.stakingContractAddr,
        provider,
      );
  }

  async getUserData() {
    const stakedAmt = await this.contract.viewMyStakedAmt();
    return {
      stakedAmt,
    };
  }
}
