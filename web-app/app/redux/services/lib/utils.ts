import { z } from 'zod';
import { tryItAsync } from '~/lib/utils';

const endpointErrSchema = z.object({ error: z.string() });

export function getIsEndpointError(err: unknown):
  err is z.infer<typeof endpointErrSchema> {
  return endpointErrSchema.safeParse(err).success;
}

const internalErrSchema = z.object({ message: z.string() });

function getIsInternalError(err: unknown):
  err is z.infer<typeof internalErrSchema> {
  return internalErrSchema.safeParse(err).success;
}

/**
 * This function helps to create query functions which automatically handle
 * error paths. This wraps the logic in a `tryItAsync` wrapper, processes the
 * trial by catching any errors, and then transforms the error to human readable
 * form by calling a mapper function (which also has to be provided when
 * calling)
 *
 * @param errorableFn The function which may result in an error,
 *  or otherwise returns the result
 *
 * @param mapInternalErrToUserFriendlyErrMsg The function that maps the
 *  internal error to a user friendly error message
 *
 * @param fallbackErrMsg The error message to show if the internal error
 *  is in an unknown format
 *
 * @returns A query function which handles the errors gracefully
 *  and in the format expected by RTK Query
 */
export function makeErrorableQueryFn<ReturnVal, Arg >(
  errorableFn: (arg: Arg) => Promise<ReturnVal>,
  mapInternalErrToUserFriendlyErrMsg:
  (internalErr: string) => string,
  fallbackErrMsg: string,
): (arg: Arg) => Promise<{ data: ReturnVal } | { error: string }> {
  return async (arg) => {
    const trial = await tryItAsync(() => errorableFn(arg));
    if (!trial.success) {
      console.error(trial.err); // this can be converted to logger later
      const { err } = trial;
      const isInternalError = getIsInternalError(err);
      if (!isInternalError) return { error: fallbackErrMsg };

      const userFriendlyError
        = mapInternalErrToUserFriendlyErrMsg(err.message);
      return { error: userFriendlyError };
    }
    return { data: trial.data };
  };
}
