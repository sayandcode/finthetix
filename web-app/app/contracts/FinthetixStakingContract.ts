import { BrowserProvider } from 'ethers';
import { DappInfo } from '~/lib/types';
import { FinthetixStakingContract, FinthetixStakingContract__factory } from './types';

export default class FinthetixStakingContractHandler {
  private contract: FinthetixStakingContract;

  constructor(private provider: BrowserProvider, dappInfo: DappInfo) {
    this.contract
      = FinthetixStakingContract__factory.connect(
        dappInfo.stakingContractAddr,
        provider,
      );
  }

  async getUserData() {
    const stakedAmt = await this.contract.viewMyStakedAmt();
    const rewardAmt = await this._getRewardAmt();
    return {
      stakedAmt,
      rewardAmt,
    };
  }

  private async _getRewardAmt() {
    const publishedReward = await this.contract.viewMyPublishedRewards();
    const accruedReward = await this._calculateAccruedReward();
    const currRewardAmt = publishedReward + accruedReward;
    return currRewardAmt;
  }

  private async _calculateAccruedReward() {
    const stakedAmt = await this.contract.viewMyStakedAmt();
    const totalRewardsPerSec = await this.contract.TOTAL_REWARDS_PER_SECOND();
    const alphaNow
      = await this.contract.alphaNow() + await this._calculateAccruedAlpha();
    const alphaOfUserAtLastInteraction
      = await this.contract.viewAlphaAtMyLastInteraction();
    return stakedAmt * totalRewardsPerSec
      * (alphaNow - alphaOfUserAtLastInteraction);
  }

  private async _calculateAccruedAlpha() {
    const totalStakedAmt = await this.contract.totalStakedAmt();
    if (totalStakedAmt === 0n) return 0n;

    const currBlockNo = await this.provider.getBlockNumber();
    const blockTimestampAsNumber
      = (await this.provider.getBlock(currBlockNo))?.timestamp;
    if (!blockTimestampAsNumber)
      throw new Error(`Current block (${currBlockNo}) doesn't exist`);

    const blockTimestamp = BigInt(blockTimestampAsNumber);
    const lastUpdatedRewardAt = await this.contract.lastUpdatedRewardAt();
    const cooldownConstant = await this.contract.COOLDOWN_CONSTANT();

    return (blockTimestamp - lastUpdatedRewardAt) * cooldownConstant
      / totalStakedAmt;
  }
}
