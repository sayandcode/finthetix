import { TrialResult } from '../types';

export default async function tryItAsync<ResultType = unknown, Err = unknown>(
  fn: () => Promise<ResultType>,
): Promise<TrialResult<ResultType, Err>> {
  try {
    const data = await fn();
    return { success: true, data };
  }
  catch (err) {
    return { success: false, err: err as Err };
  }
}
