import { BrowserProvider, ContractRunner, JsonRpcProvider, JsonRpcSigner } from 'ethers';
import { DappInfo, TimestampInMs } from '~/lib/types';
import { FinthetixRewardToken, FinthetixRewardToken__factory, FinthetixStakingContract, FinthetixStakingContract__factory, FinthetixStakingToken, FinthetixStakingToken__factory } from './types';
import { StakeBalChangedEvent, UserRewardUpdatedEvent } from './types/FinthetixStakingContract.sol/FSCEvents';
import { z } from 'zod';

export type FinthetixUserData = Awaited<ReturnType<FinthetixStakingContractHandler['getUserData']>>;

export type HistoricalStakedAmtData = {
  timestampInMs: TimestampInMs
  totalAmtStakedByUserVal: bigint
}[];

export type HistoricalRewardAmtData = {
  timestampInMs: TimestampInMs
  rewardBalVal: bigint
}[];

export type FinthetixMetadata = {
  stakingToken: {
    decimals: number
    symbol: string
  }
  rewardToken: {
    decimals: number
    symbol: string
  }
};

class Base {
  private __stakingContract?: FinthetixStakingContract;
  private __stakingToken?: FinthetixStakingToken;
  private __rewardToken?: FinthetixRewardToken;

  constructor(
    protected _dappInfo: DappInfo,
    private _signerOrProvider: ContractRunner,
  ) { }

  /**
   * Contract Handler Getters:
   * These are a awrapper around the contract factories
   */

  protected get _stakingContract(): FinthetixStakingContract {
    if (!this.__stakingContract)
      this.__stakingContract = FinthetixStakingContract__factory.connect(
        this._dappInfo.stakingContractAddr,
        this._signerOrProvider,
      );

    return this.__stakingContract;
  }

  protected get _stakingToken(): FinthetixStakingToken {
    if (!this.__stakingToken)
      this.__stakingToken = FinthetixStakingToken__factory.connect(
        this._dappInfo.stakingTokenAddr,
        this._signerOrProvider,
      );

    return this.__stakingToken;
  }

  protected get _rewardToken(): FinthetixRewardToken {
    if (!this.__rewardToken)
      this.__rewardToken = FinthetixRewardToken__factory.connect(
        this._dappInfo.rewardTokenAddr,
        this._signerOrProvider,
      );

    return this.__rewardToken;
  }
}

/**
 * This is intended to be used on the client side by the user's signer.
 * This enables them to sign transactions to user-only methods.
 * All `super` methods are called with the signer provided when instantiating
 * this class
 */
export default class FinthetixStakingContractHandler extends Base {
  static async make(provider: BrowserProvider, dappInfo: DappInfo) {
    const signer = await provider.getSigner();
    return new FinthetixStakingContractHandler(signer, dappInfo);
  }

  private constructor(private _signer: JsonRpcSigner, _dappInfo: DappInfo) {
    super(_dappInfo, _signer);
  }

  /**
   * Public Fns
   */

  async getUserData() {
    const userAddr = this._signer.address;

    const stakedAmtVal = await super._stakingContract.viewMyStakedAmt();
    const rewardAmtVal = await this._getRewardAmt();
    const stakingTokenBalVal = await super._stakingToken.balanceOf(userAddr);

    return { stakedAmtVal, rewardAmtVal, stakingTokenBalVal };
  }

  async requestSampleTokens() {
    const txn = await super._stakingToken.requestSampleTokens();
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
      = await super._stakingToken.approve(
        super._dappInfo.stakingContractAddr, amtToStake,
      );
    await approvalTxn.wait();

    // stake
    const stakeTxn = await super._stakingContract.stake(amtToStake);
    await stakeTxn.wait();
  }

  async unstake(amtToUnstake: bigint) {
    const txn = await super._stakingContract.unstake(amtToUnstake);
    await txn.wait();
  }

  async withdrawReward() {
    const txn = await super._stakingContract.withdrawRewards();
    await txn.wait();
  }

  async getHistoricalStakedAmt(): Promise<HistoricalStakedAmtData> {
    const senderAddr = this._signer.address;
    const eventFilter
      = super._stakingContract.filters.StakeBalChanged(senderAddr);
    const eventLogs = await super._stakingContract.queryFilter(eventFilter);

    // process the logs
    const decodeLogsPromises = eventLogs.map(async (log) => {
      const decodedEventLog
        = super._stakingContract.interface
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
      = super._stakingContract.filters.UserRewardUpdated(senderAddr);
    const eventLogs = await super._stakingContract.queryFilter(eventFilter);

    // process the logs
    const decodeLogPromises = eventLogs.map(async (log) => {
      const decodedEventLog
        = super
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

  /**
   * Handler Query Functions:
   * These only need provider not signer in the constract handler
   * */

  private async _getRewardAmt() {
    const publishedReward
      = await super._stakingContract.viewMyPublishedRewards();
    const accruedReward
      = await this._calculateAccruedReward();
    const currRewardAmt = publishedReward + accruedReward;
    return currRewardAmt;
  }

  private async _calculateAccruedReward() {
    const stakedAmt = await super._stakingContract.viewMyStakedAmt();
    const totalRewardsPerSec
      = await super._stakingContract.TOTAL_REWARDS_PER_SECOND();
    const alphaNow
      = await super._stakingContract.alphaNow()
      + await this._calculateAccruedAlpha();
    const alphaOfUserAtLastInteraction
      = await super._stakingContract.viewAlphaAtMyLastInteraction();
    const cooldownConstant = await super._stakingContract.COOLDOWN_CONSTANT();
    return stakedAmt * totalRewardsPerSec
      * (alphaNow - alphaOfUserAtLastInteraction) / cooldownConstant;
  }

  private async _calculateAccruedAlpha() {
    const totalStakedAmt = await super._stakingContract.totalStakedAmt();
    if (totalStakedAmt === 0n) return 0n;

    const currBlockNo = await this._signer.provider.getBlockNumber();
    const blockTimestampAsNumber
      = (await this._signer.provider.getBlock(currBlockNo))?.timestamp;
    if (!blockTimestampAsNumber)
      throw new Error(`Current block (${currBlockNo}) doesn't exist`);

    const blockTimestamp = BigInt(blockTimestampAsNumber);
    const lastUpdatedRewardAt
      = await super._stakingContract.lastUpdatedRewardAt();
    const cooldownConstant = await super._stakingContract.COOLDOWN_CONSTANT();

    return (blockTimestamp - lastUpdatedRewardAt) * cooldownConstant
      / totalStakedAmt;
  }
}

/**
 * This class is intended to be used on the server side, for querying
 * any user-agnostic data about the Finthetix Staking Contract. As such
 * it initializes the base with a JsonRpcProvider, instead of a user
 * specific signer such as in {@link FinthetixStakingContractHandler}
 */
export class ReadonlyFinthetixStakingContractHandler extends Base {
  constructor(rpcUrl: string, dappInfo: DappInfo) {
    const provider = new JsonRpcProvider(rpcUrl);
    super(dappInfo, provider);
  }

  async getMetadata(): Promise<FinthetixMetadata> {
    const stakingToken = {
      decimals: Number(await super._stakingToken.decimals()),
      symbol: await super._stakingToken.symbol(),
    };

    const rewardToken = {
      decimals: Number(await super._rewardToken.decimals()),
      symbol: await super._rewardToken.symbol(),
    };

    return { stakingToken, rewardToken };
  }
}
