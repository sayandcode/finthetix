import { FinthetixLogDataQueryResult } from '~/redux/services/metamask';

type StakedAmtVal = number;
type RewardAmtVal = number;
type ReadableTimestamp = string;

export default function getGraphDataFromLogData(
  stakingLogData: FinthetixLogDataQueryResult['stakedAmt'],
  rewardsLogData: FinthetixLogDataQueryResult['rewardAmt'],
):
  {
    stakedAmtVals: StakedAmtVal[]
    rewardAmtVals: RewardAmtVal[]
    readableTimestamps: ReadableTimestamp[]
  } {
  // sort the input arrays
  const sortedStakeEventsQueue
    = structuredClone(stakingLogData)
      .sort((a, b) => a.timestampInMs - b.timestampInMs);
  const sortedRewardEventsQueue
    = structuredClone(rewardsLogData)
      .sort((a, b) => a.timestampInMs - b.timestampInMs);

  const stakedAmtVals: StakedAmtVal[] = [];
  const rewardAmtVals: RewardAmtVal[] = [];
  const readableTimestamps: ReadableTimestamp[] = [];

  // All stake events have reward events, but not vice versa
  // so reward events is the longer array and a superset
  const noOfDatapoints = rewardsLogData.length;
  for (let i = 0; i < noOfDatapoints; i++) {
    const rewardEvent = sortedRewardEventsQueue[0];
    if (!rewardEvent) throw new Error('All reward events must exist in queue');

    const rewardAmt = Number(rewardEvent.rewardBalVal);
    rewardAmtVals.push(rewardAmt);
    sortedRewardEventsQueue.shift();

    const timestamp = rewardEvent.timestampInMs;
    const readableTimestamp = new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    readableTimestamps.push(readableTimestamp);

    const stakeEvent = sortedStakeEventsQueue[0];
    let stakedAmt: StakedAmtVal = stakedAmtVals.at(-1) || 0;
    const doesStakeEventCorrespondingToTimestampExist
      = stakeEvent?.timestampInMs === timestamp;
    if (doesStakeEventCorrespondingToTimestampExist) {
      stakedAmt = Number(stakeEvent.totalAmtStakedByUserVal);
      sortedStakeEventsQueue.shift();
    }
    stakedAmtVals.push(stakedAmt);
  }

  return { stakedAmtVals, rewardAmtVals, readableTimestamps };
}
