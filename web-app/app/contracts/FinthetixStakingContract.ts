import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { DappInfo } from '~/lib/types';
import { FinthetixRewardToken, FinthetixRewardToken__factory, FinthetixStakingContract, FinthetixStakingContract__factory, FinthetixStakingToken, FinthetixStakingToken__factory } from './types';
import { getReadableERC20TokenCount } from '~/lib/utils';

export default class FinthetixStakingContractHandler {
  constructor(
    private _provider: BrowserProvider, private _dappInfo: DappInfo,
  ) {}

  /**
   * Public Fns
   */

  async getUserData() {
    /** Contract Handlers */
    // this function only reads data using view fns so we only need a provider
    const stakingContract = this._getStakingContract(this._provider);
    const stakingToken = this._getStakingToken(this._provider);
    const rewardToken = this._getRewardToken(this._provider);

    // fetch data
    const stakedAmt = await stakingContract.viewMyStakedAmt();
    const rewardAmt = await this._query_getRewardAmt(stakingContract);
    const stakingTokenDecimals = Number(await stakingToken.decimals());
    const rewardTokenDecimals = Number(await rewardToken.decimals());

    return {
      stakedAmt:
        getReadableERC20TokenCount(stakedAmt, stakingTokenDecimals),
      rewardAmt:
        getReadableERC20TokenCount(rewardAmt, rewardTokenDecimals),
    };
  }

  /**
   * Contract Handler Getters:
   * These are a awrapper around the contract factories
   */

  private _getStakingContract(
    providerOrSigner: BrowserProvider | JsonRpcSigner,
  ): FinthetixStakingContract {
    return FinthetixStakingContract__factory.connect(
      this._dappInfo.stakingContractAddr,
      providerOrSigner,
    );
  }

  private _getStakingToken(
    providerOrSigner: BrowserProvider | JsonRpcSigner,
  ): FinthetixStakingToken {
    return FinthetixStakingToken__factory
      .connect(this._dappInfo.stakingTokenAddr, providerOrSigner);
  }

  private _getRewardToken(
    providerOrSigner: BrowserProvider | JsonRpcSigner,
  ): FinthetixRewardToken {
    return FinthetixRewardToken__factory
      .connect(this._dappInfo.rewardTokenAddr, providerOrSigner);
  }

  /**
   * Handler Query Functions:
   * These only need provider not signer in the constract handler
   * */

  private async _query_getRewardAmt(
    queryableStakingContract: FinthetixStakingContract,
  ) {
    const publishedReward
      = await queryableStakingContract.viewMyPublishedRewards();
    const accruedReward
      = await this._query_calculateAccruedReward(queryableStakingContract);
    const currRewardAmt = publishedReward + accruedReward;
    return currRewardAmt;
  }

  private async _query_calculateAccruedReward(
    queryableStakingContract: FinthetixStakingContract,
  ) {
    const stakedAmt = await queryableStakingContract.viewMyStakedAmt();
    const totalRewardsPerSec
      = await queryableStakingContract.TOTAL_REWARDS_PER_SECOND();
    const alphaNow
      = await queryableStakingContract.alphaNow()
      + await this._query_calculateAccruedAlpha(queryableStakingContract);
    const alphaOfUserAtLastInteraction
      = await queryableStakingContract.viewAlphaAtMyLastInteraction();
    return stakedAmt * totalRewardsPerSec
      * (alphaNow - alphaOfUserAtLastInteraction);
  }

  private async _query_calculateAccruedAlpha(
    queryableStakingContract: FinthetixStakingContract,
  ) {
    const totalStakedAmt = await queryableStakingContract.totalStakedAmt();
    if (totalStakedAmt === 0n) return 0n;

    const currBlockNo = await this._provider.getBlockNumber();
    const blockTimestampAsNumber
      = (await this._provider.getBlock(currBlockNo))?.timestamp;
    if (!blockTimestampAsNumber)
      throw new Error(`Current block (${currBlockNo}) doesn't exist`);

    const blockTimestamp = BigInt(blockTimestampAsNumber);
    const lastUpdatedRewardAt
      = await queryableStakingContract.lastUpdatedRewardAt();
    const cooldownConstant = await queryableStakingContract.COOLDOWN_CONSTANT();

    return (blockTimestamp - lastUpdatedRewardAt) * cooldownConstant
      / totalStakedAmt;
  }
}
