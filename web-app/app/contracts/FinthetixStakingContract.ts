import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { DappInfo } from '~/lib/types';
import { FinthetixRewardToken, FinthetixRewardToken__factory, FinthetixStakingContract, FinthetixStakingContract__factory, FinthetixStakingToken, FinthetixStakingToken__factory } from './types';
import { getReadableERC20TokenCount } from '~/lib/utils';

/**
 * The amount to stake as a string. This helps because bigints may
 * not be serializable midway
 */
export type AmtToStakeStr = string;

export default class FinthetixStakingContractHandler {
  static async make(provider: BrowserProvider, dappInfo: DappInfo) {
    const signer = await provider.getSigner();
    return new FinthetixStakingContractHandler(signer, dappInfo);
  }

  private __stakingContract?: FinthetixStakingContract;
  private __stakingToken?: FinthetixStakingToken;
  private __rewardToken?: FinthetixRewardToken;

  private constructor(
    private _signer: JsonRpcSigner, private _dappInfo: DappInfo,
  ) {}

  /**
   * Public Fns
   */

  async getUserData() {
    const stakedAmt = await this._stakingContract.viewMyStakedAmt();
    const rewardAmt = await this._getRewardAmt();
    const stakingTokenDecimals = Number(await this._stakingToken.decimals());
    const rewardTokenDecimals = Number(await this._rewardToken.decimals());

    return {
      stakedAmt:
        getReadableERC20TokenCount(stakedAmt, stakingTokenDecimals),
      rewardAmt:
        getReadableERC20TokenCount(rewardAmt, rewardTokenDecimals),
    };
  }

  async requestSampleTokens() {
    const txn = await this._stakingToken.requestSampleTokens();
    await txn.wait();
  }

  /**
   * This function first approves the said number of tokens for transfer by the
   * staking contract, and then stakes said amount.
   *
   * @param amtToStakeStr The amount to stake as a string. This helps because
   *  bigints may not be serializable midway
   */
  async stake(amtToStakeStr: AmtToStakeStr) {
    const amtToStake = BigInt(amtToStakeStr);

    // approve
    const approvalTxn
      = await this._stakingToken.approve(
        this._dappInfo.stakingContractAddr, amtToStake,
      );
    await approvalTxn.wait();

    // stake
    const stakeTxn = await this._stakingContract.stake(amtToStake);
    await stakeTxn.wait();
  }

  /**
   * Contract Handler Getters:
   * These are a awrapper around the contract factories
   */

  private get _stakingContract(): FinthetixStakingContract {
    if (!this.__stakingContract)
      this.__stakingContract = FinthetixStakingContract__factory.connect(
        this._dappInfo.stakingContractAddr,
        this._signer,
      );

    return this.__stakingContract;
  }

  private get _stakingToken(): FinthetixStakingToken {
    if (!this.__stakingToken)
      this.__stakingToken = FinthetixStakingToken__factory.connect(
        this._dappInfo.stakingTokenAddr,
        this._signer,
      );

    return this.__stakingToken;
  }

  private get _rewardToken(): FinthetixRewardToken {
    if (!this.__rewardToken)
      this.__rewardToken = FinthetixRewardToken__factory.connect(
        this._dappInfo.rewardTokenAddr,
        this._signer,
      );

    return this.__rewardToken;
  }

  /**
   * Handler Query Functions:
   * These only need provider not signer in the constract handler
   * */

  private async _getRewardAmt() {
    const publishedReward
      = await this._stakingContract.viewMyPublishedRewards();
    const accruedReward
      = await this._calculateAccruedReward();
    const currRewardAmt = publishedReward + accruedReward;
    return currRewardAmt;
  }

  private async _calculateAccruedReward() {
    const stakedAmt = await this._stakingContract.viewMyStakedAmt();
    const totalRewardsPerSec
      = await this._stakingContract.TOTAL_REWARDS_PER_SECOND();
    const alphaNow
      = await this._stakingContract.alphaNow()
      + await this._calculateAccruedAlpha();
    const alphaOfUserAtLastInteraction
      = await this._stakingContract.viewAlphaAtMyLastInteraction();
    return stakedAmt * totalRewardsPerSec
      * (alphaNow - alphaOfUserAtLastInteraction);
  }

  private async _calculateAccruedAlpha() {
    const totalStakedAmt = await this._stakingContract.totalStakedAmt();
    if (totalStakedAmt === 0n) return 0n;

    const currBlockNo = await this._signer.provider.getBlockNumber();
    const blockTimestampAsNumber
      = (await this._signer.provider.getBlock(currBlockNo))?.timestamp;
    if (!blockTimestampAsNumber)
      throw new Error(`Current block (${currBlockNo}) doesn't exist`);

    const blockTimestamp = BigInt(blockTimestampAsNumber);
    const lastUpdatedRewardAt
      = await this._stakingContract.lastUpdatedRewardAt();
    const cooldownConstant = await this._stakingContract.COOLDOWN_CONSTANT();

    return (blockTimestamp - lastUpdatedRewardAt) * cooldownConstant
      / totalStakedAmt;
  }
}
