import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TrialResult } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function tryItAsync<ResultType = unknown, Err = unknown>(
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
