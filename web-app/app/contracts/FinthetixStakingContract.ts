import { InterfaceAbi, Contract, BrowserProvider } from 'ethers';
import { DappInfo } from '~/lib/types';

type TFinthetixStakingContract = Contract & {
  viewMyStakedAmt: () => Promise<bigint>
};

export default class FinthetixStakingContractHandler {
  private static readonly ABI: InterfaceAbi = [
    'function viewMyStakedAmt() external view returns (uint)',
  ];

  private contract: TFinthetixStakingContract;

  constructor(provider: BrowserProvider, dappInfo: DappInfo) {
    this.contract
      = new Contract(
        dappInfo.stakingContractAddr,
        FinthetixStakingContractHandler.ABI,
        provider,
      ) as TFinthetixStakingContract;
  }

  async getUserData() {
    const stakedAmt = await this.contract.viewMyStakedAmt();
    return {
      stakedAmt,
    };
  }
}
