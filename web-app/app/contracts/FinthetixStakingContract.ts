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
  totalRewardsPerSec: bigint
};

export type TxnHash = string;

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
   * These are a wrapper around the contract factories
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

    const stakedAmtValPromise = this._stakingContract.viewMyStakedAmt();
    const rewardAmtValPromise = this._getRewardAmt();
    const stakingTokenBalValPromise
      = this._stakingToken.balanceOf(userAddr);

    const [stakedAmtVal, rewardAmtVal, stakingTokenBalVal]
      = await Promise.all(
        [stakedAmtValPromise, rewardAmtValPromise, stakingTokenBalValPromise],
      );

    return { stakedAmtVal, rewardAmtVal, stakingTokenBalVal };
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
   * @returns A promise containing the transaction hash
   */
  async stake(amtToStake: bigint): Promise<TxnHash> {
    // approve
    const approvalTxn
      = await this._stakingToken.approve(
        this._dappInfo.stakingContractAddr, amtToStake,
      );
    await approvalTxn.wait();

    // stake
    const stakeTxn = await this._stakingContract.stake(amtToStake);
    await stakeTxn.wait();
    return stakeTxn.hash;
  }

  async unstake(amtToUnstake: bigint): Promise<TxnHash> {
    const txn = await this._stakingContract.unstake(amtToUnstake);
    await txn.wait();
    return txn.hash;
  }

  async withdrawReward(): Promise<TxnHash> {
    const txn = await this._stakingContract.withdrawRewards();
    await txn.wait();
    return txn.hash;
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

  /**
   * Internal Fns
   * */

  private async _getRewardAmt() {
    const publishedRewardPromise
      = this._stakingContract.viewMyPublishedRewards();
    const accruedRewardPromise = this._calculateAccruedReward();

    const [publishedReward, accruedReward]
      = await Promise.all([publishedRewardPromise, accruedRewardPromise]);

    const currRewardAmt = publishedReward + accruedReward;
    return currRewardAmt;
  }

  private async _calculateAccruedReward() {
    const stakedAmtPromise = this._stakingContract.viewMyStakedAmt();
    const totalRewardsPerSecPromise
      = this._stakingContract.TOTAL_REWARDS_PER_SECOND();
    const alphaOfUserAtLastInteractionPromise
      = this._stakingContract.viewAlphaAtMyLastInteraction();
    const cooldownConstantPromise = this._stakingContract.COOLDOWN_CONSTANT();
    const publishedAlphaNowPromise = this._stakingContract.alphaNow();
    const calculatedAccruedAlphaPromise = this._calculateAccruedAlpha();

    const [
      stakedAmt,
      totalRewardsPerSec,
      alphaOfUserAtLastInteraction,
      cooldownConstant,
      publishedAlphaNow,
      calculatedAccruedAlpha,
    ]
      = await Promise.all([
        stakedAmtPromise,
        totalRewardsPerSecPromise,
        alphaOfUserAtLastInteractionPromise,
        cooldownConstantPromise,
        publishedAlphaNowPromise,
        calculatedAccruedAlphaPromise,
      ]);

    const alphaNow = publishedAlphaNow + calculatedAccruedAlpha;
    return stakedAmt * totalRewardsPerSec
      * (alphaNow - alphaOfUserAtLastInteraction) / cooldownConstant;
  }

  private async _calculateAccruedAlpha() {
    const totalStakedAmt = await this._stakingContract.totalStakedAmt();
    if (totalStakedAmt === 0n) return 0n;

    const lastUpdatedRewardAtPromise
      = this._stakingContract.lastUpdatedRewardAt();
    const cooldownConstantPromise = this._stakingContract.COOLDOWN_CONSTANT();

    const blockTimestampAsNumber
      = (await this._signer.provider.getBlock('latest'))?.timestamp;
    if (!blockTimestampAsNumber)
      throw new Error(`Current block doesn't exist`);

    const blockTimestamp = BigInt(blockTimestampAsNumber);

    const [lastUpdatedRewardAt, cooldownConstant]
      = await Promise.all(
        [lastUpdatedRewardAtPromise, cooldownConstantPromise],
      );

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
    const totalRewardsPerSecPromise
      = this._stakingContract.TOTAL_REWARDS_PER_SECOND();

    const stakingTokenPromises = {
      decimals: this._stakingToken.decimals(),
      symbol: this._stakingToken.symbol(),
    };

    const rewardTokenPromises = {
      decimals: this._rewardToken.decimals(),
      symbol: this._rewardToken.symbol(),
    };

    const stakingToken = {
      decimals: Number(await stakingTokenPromises.decimals),
      symbol: await stakingTokenPromises.symbol,
    };

    const rewardToken = {
      decimals: Number(await rewardTokenPromises.decimals),
      symbol: await rewardTokenPromises.symbol,
    };

    const totalRewardsPerSec = await totalRewardsPerSecPromise;

    return { stakingToken, rewardToken, totalRewardsPerSec };
  }
}
