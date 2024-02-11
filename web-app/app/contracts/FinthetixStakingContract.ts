import { BrowserProvider } from 'ethers';
import { DappInfo } from '~/lib/types';
import { FinthetixRewardToken__factory, FinthetixStakingContract, FinthetixStakingContract__factory, FinthetixStakingToken__factory } from './types';
import { getReadableERC20TokenCount } from '~/lib/utils';

export default class FinthetixStakingContractHandler {
  private stakingContract: FinthetixStakingContract;

  // these will definitely assigned in async constructor `make`
  private STAKING_TOKEN_DECIMALS: number = NaN;
  private REWARD_TOKEN_DECIMALS: number = NaN;

  static async make(provider: BrowserProvider, dappInfo: DappInfo) {
    const handler = new this(provider, dappInfo);
    await handler._updateDecimals(provider);
    return handler;
  }

  private constructor(private provider: BrowserProvider, dappInfo: DappInfo) {
    this.stakingContract
      = FinthetixStakingContract__factory.connect(
        dappInfo.stakingContractAddr,
        provider,
      );
  }

  async getUserData() {
    const stakedAmt = await this.stakingContract.viewMyStakedAmt();
    const rewardAmt = await this._getRewardAmt();
    return {
      stakedAmt:
        getReadableERC20TokenCount(stakedAmt, this.STAKING_TOKEN_DECIMALS),
      rewardAmt:
        getReadableERC20TokenCount(rewardAmt, this.REWARD_TOKEN_DECIMALS),
    };
  }

  private async _getRewardAmt() {
    const publishedReward = await this.stakingContract.viewMyPublishedRewards();
    const accruedReward = await this._calculateAccruedReward();
    const currRewardAmt = publishedReward + accruedReward;
    return currRewardAmt;
  }

  private async _calculateAccruedReward() {
    const stakedAmt = await this.stakingContract.viewMyStakedAmt();
    const totalRewardsPerSec
      = await this.stakingContract.TOTAL_REWARDS_PER_SECOND();
    const alphaNow
      = await this.stakingContract.alphaNow()
      + await this._calculateAccruedAlpha();
    const alphaOfUserAtLastInteraction
      = await this.stakingContract.viewAlphaAtMyLastInteraction();
    return stakedAmt * totalRewardsPerSec
      * (alphaNow - alphaOfUserAtLastInteraction);
  }

  private async _calculateAccruedAlpha() {
    const totalStakedAmt = await this.stakingContract.totalStakedAmt();
    if (totalStakedAmt === 0n) return 0n;

    const currBlockNo = await this.provider.getBlockNumber();
    const blockTimestampAsNumber
      = (await this.provider.getBlock(currBlockNo))?.timestamp;
    if (!blockTimestampAsNumber)
      throw new Error(`Current block (${currBlockNo}) doesn't exist`);

    const blockTimestamp = BigInt(blockTimestampAsNumber);
    const lastUpdatedRewardAt
      = await this.stakingContract.lastUpdatedRewardAt();
    const cooldownConstant = await this.stakingContract.COOLDOWN_CONSTANT();

    return (blockTimestamp - lastUpdatedRewardAt) * cooldownConstant
      / totalStakedAmt;
  }

  private async _updateDecimals(provider: BrowserProvider) {
    const stakingTokenAddr = await this.stakingContract.stakingToken();
    this.STAKING_TOKEN_DECIMALS = Number(
      await FinthetixStakingToken__factory
        .connect(stakingTokenAddr, provider)
        .decimals(),
    );

    const rewardTokenAddr = await this.stakingContract.rewardToken();
    this.REWARD_TOKEN_DECIMALS = Number(
      await FinthetixRewardToken__factory
        .connect(rewardTokenAddr, provider)
        .decimals(),
    );
  }
}
