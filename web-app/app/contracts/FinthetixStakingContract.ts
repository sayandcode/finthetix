import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { DappInfo } from '~/lib/types';
import { FinthetixRewardToken, FinthetixRewardToken__factory, FinthetixStakingContract, FinthetixStakingContract__factory, FinthetixStakingToken, FinthetixStakingToken__factory } from './types';
import { StakeBalChangedEvent, UserRewardUpdatedEvent } from './types/FinthetixStakingContract.sol/FSCEvents';
import { z } from 'zod';

export type FinthetixUserData = Awaited<ReturnType<FinthetixStakingContractHandler['getUserData']>>;

export type HistoricalStakedAmtData = {
  timestampInMs: number
  totalAmtStakedByUserVal: bigint
}[];

export type HistoricalRewardAmtData = {
  timestampInMs: number
  rewardBalVal: bigint
}[];

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
    const stakingTokenDecimals = await this.getStakingTokenDecimals();
    const rewardTokenDecimals = Number(await this._rewardToken.decimals());
    const userAddr = this._signer.address;

    const stakedAmt = await this._stakingContract.viewMyStakedAmt();
    const rewardAmt = await this._getRewardAmt();
    const stakingTokenBalAmt = await this._stakingToken.balanceOf(userAddr);

    return {
      stakedAmt: { value: stakedAmt, decimals: stakingTokenDecimals },
      rewardAmt: { value: rewardAmt, decimals: rewardTokenDecimals },
      stakingTokenBal:
        { value: stakingTokenBalAmt, decimals: stakingTokenDecimals },
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
   * @param amtToStake The amount to stake
   */
  async stake(amtToStake: bigint) {
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

  async unstake(amtToUnstake: bigint) {
    const txn = await this._stakingContract.unstake(amtToUnstake);
    await txn.wait();
  }

  async withdrawReward() {
    const txn = await this._stakingContract.withdrawRewards();
    await txn.wait();
  }

  async getHistoricalStakedAmt(): Promise<HistoricalStakedAmtData> {
    const senderAddr = this._signer.address;
    const eventFilter
      = this._stakingContract.filters.StakeBalChanged(senderAddr);
    const eventLogs = await this._stakingContract.queryFilter(eventFilter);

    // process the logs
    const decodeLogsPromises = eventLogs.map(async (log) => {
      const decodedEventLog
        = this._stakingContract.interface
          .decodeEventLog(log.fragment, log.data, log.topics);
      const decodedEventLogSchema
        = z.tuple([z.string(), z.bigint()]) satisfies
            z.ZodType<StakeBalChangedEvent.InputTuple>;
      const [, totalAmtStakedByUserVal]
          = decodedEventLogSchema.parse(decodedEventLog);
      const timeStampInS = (await log.getBlock()).timestamp;
      const timestampInMs = timeStampInS * 1000;
      return {
        timestampInMs,
        totalAmtStakedByUserVal,
      };
    });
    const decodedLogs = await Promise.all(decodeLogsPromises);

    return decodedLogs;
  }

  async getHistoricalRewardAmt(): Promise<HistoricalRewardAmtData> {
    const senderAddr = this._signer.address;
    const eventFilter
      = this._stakingContract.filters.UserRewardUpdated(senderAddr);
    const eventLogs = await this._stakingContract.queryFilter(eventFilter);

    // process the logs
    const decodeLogPromises = eventLogs.map(async (log) => {
      const decodedEventLog
        = this
          ._stakingContract
          .interface
          .decodeEventLog(log.fragment, log.data, log.topics);

      const decodedEventLogSchema
        = z.tuple([z.string(), z.bigint()]) satisfies
        z.ZodType<UserRewardUpdatedEvent.InputTuple>;

      const [, updatedRewardBal]
        = decodedEventLogSchema.parse(decodedEventLog);
      const timeStampInS = (await log.getBlock()).timestamp;
      const timestampInMs = timeStampInS * 1000;
      return {
        timestampInMs,
        rewardBalVal: updatedRewardBal,
      };
    });

    const decodedLogs = await Promise.all(decodeLogPromises);
    return decodedLogs;
  }

  async getStakingTokenDecimals() {
    return Number(await this._stakingToken.decimals());
  }

  async getRewardTokenDecimals() {
    return Number(await this._rewardToken.decimals());
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
    const cooldownConstant = await this._stakingContract.COOLDOWN_CONSTANT();
    return stakedAmt * totalRewardsPerSec
      * (alphaNow - alphaOfUserAtLastInteraction) / cooldownConstant;
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
