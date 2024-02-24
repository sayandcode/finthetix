import { TimestampInMs } from '~/lib/types';
import { FinthetixLogDataQueryResult } from '~/redux/services/metamask';

type StakedAmtVal = number | null;
type RewardAmtVal = number;

export default function getGraphDataFromLogData(
  stakeEventHistoricalData: FinthetixLogDataQueryResult['stakedAmt']['historicalData'],
  rewardEventHistoricalData: FinthetixLogDataQueryResult['rewardAmt']['historicalData'],
):
  {
    stakedAmtVals: StakedAmtVal[]
    rewardAmtVals: RewardAmtVal[]
    timestampsInMs: TimestampInMs[]
  } {
  // sort the input arrays
  const sortedStakeEventsQueue
    = structuredClone(stakeEventHistoricalData)
      .sort((a, b) => a.timestampInMs - b.timestampInMs);
  const sortedRewardEventsQueue
    = structuredClone(rewardEventHistoricalData)
      .sort((a, b) => a.timestampInMs - b.timestampInMs);

  const stakedAmtVals: StakedAmtVal[] = [];
  const rewardAmtVals: RewardAmtVal[] = [];
  const timestampsInMs: TimestampInMs[] = [];

  // All stake events have reward events, but not vice versa
  // so reward events is the longer array and a superset
  const noOfDatapoints = rewardEventHistoricalData.length;
  for (let i = 0; i < noOfDatapoints; i++) {
    const rewardEvent = sortedRewardEventsQueue[0];
    if (!rewardEvent) throw new Error('All reward events must exist in queue');

    const rewardAmt = Number(rewardEvent.rewardBalVal);
    rewardAmtVals.push(rewardAmt);
    sortedRewardEventsQueue.shift();

    const timestamp = rewardEvent.timestampInMs;
    timestampsInMs.push(timestamp);

    const stakeEvent = sortedStakeEventsQueue[0];
    let stakedAmt: StakedAmtVal | null = null;
    const doesStakeEventCorrespondingToTimestampExist
      = stakeEvent?.timestampInMs === timestamp;
    if (doesStakeEventCorrespondingToTimestampExist) {
      stakedAmt = Number(stakeEvent.totalAmtStakedByUserVal);
      sortedStakeEventsQueue.shift();
    }
    stakedAmtVals.push(stakedAmt);
  }

  return { stakedAmtVals, rewardAmtVals, timestampsInMs };
}
