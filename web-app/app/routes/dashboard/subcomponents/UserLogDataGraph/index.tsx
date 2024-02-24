import { Loader2Icon } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import getReadableERC20TokenCount from '~/lib/utils/readableERC20';
import { selectIsUserLoggedIn } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';
import { FinthetixLogDataQueryResult, useLazyGetFinthetixLogDataQuery } from '~/redux/services/metamask';

type LogDataItem = FinthetixLogDataQueryResult['historicalData'][number];

type KeyInLogData<KeyLabel>
  = KeyLabel extends keyof LogDataItem ? KeyLabel : never;

type XValKey = KeyInLogData<'timestampInMs'>;
const xValKey: XValKey = 'timestampInMs';

type YValKey = KeyInLogData<'totalAmtStakedByUserVal'>;
const yValKey: YValKey = 'totalAmtStakedByUserVal';

const Y_AXIS_LABEL = 'Staked Tokens';

export default function UserLogDataGraph() {
  const isUserLoggedIn = useAppSelector(selectIsUserLoggedIn);
  const { dappInfo } = useRootLoaderData();
  const [getLogData, { data, isFetching }] = useLazyGetFinthetixLogDataQuery();

  useEffect(() => {
    if (!isUserLoggedIn) return;

    getLogData(dappInfo);
  }, [isUserLoggedIn, getLogData, dappInfo]);

  const xAxisValFormatter
    = useCallback(
      (value: LogDataItem[XValKey]) => {
        return new Date(value).toLocaleString();
      },
      []);
  const yAxisValFormatter = useCallback(
    (value: LogDataItem[YValKey]) => {
      if (!data?.stakingTokenDecimals) throw new Error('Cannot format y values without fetching data');
      const readableTokenCount = getReadableERC20TokenCount(
        { value, decimals: data?.stakingTokenDecimals }, 4,
      );

      return [readableTokenCount, Y_AXIS_LABEL];
    }, [data?.stakingTokenDecimals]);

  if (!data || isFetching) return (
    <div className="w-full h-72 flex justify-center items-center bg-white border-primary">
      <Loader2Icon className="animate-spin h-10 w-10" />
    </div>
  );

  if (!data?.historicalData.length) return null;

  return (
    <div className="w-full h-72 bg-white border-primary px-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.historicalData}>
          <Tooltip
            formatter={yAxisValFormatter}
            labelFormatter={xAxisValFormatter}
          />

          <Bar dataKey={yValKey} fill="#facc15" maxBarSize={40} />

          <XAxis
            dataKey={xValKey}
            domain={['dataMin', 'dataMax']}
            tickFormatter={tickVal => new Date(tickVal).toDateString()}
          />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}
