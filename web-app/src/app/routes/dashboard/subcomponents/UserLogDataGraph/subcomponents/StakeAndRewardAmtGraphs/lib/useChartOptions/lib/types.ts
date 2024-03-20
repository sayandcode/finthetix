import { TooltipItem } from 'chart.js';
import { z } from 'zod';
import getGraphDataFromLogData from '~/routes/dashboard/subcomponents/UserLogDataGraph/lib/getGraphDataFromLogData';

export type DashboardGraphData = ReturnType<typeof getGraphDataFromLogData>;

export type TickFormatterFn
  = (tickValue: string | number) => string | string[] | number | number[];
export type TooltipFormatterFn = (tooltipItem: TooltipItem<'bar' | 'line'>) => string | string[];

export const stakedAmtValSchema = z.number() satisfies z.ZodType<DashboardGraphData['stakedAmtVals'][number]>;
export const rewardAmtValSchema = z.number() satisfies z.ZodType<DashboardGraphData['stakedAmtVals'][number]>;
export const graphYValsSchema
  = z.union([stakedAmtValSchema, rewardAmtValSchema]);

export enum DASHBOARD_CHART_Y_AXIS_IDS {
  REWARD_AMT = 'rewardAmt',
  STAKED_AMT = 'stakedAmt',
}

export function getIsValidYAxisIDForDashboardChart(str: string | undefined):
  str is DASHBOARD_CHART_Y_AXIS_IDS {
  if (!str) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values(DASHBOARD_CHART_Y_AXIS_IDS).includes(str as any);
}
