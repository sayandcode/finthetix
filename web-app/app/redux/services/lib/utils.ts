import { z } from 'zod';
import { tryItAsync } from '~/lib/utils';

const endpointErrSchema = z.object({ error: z.string() });

export function getIsEndpointError(err: unknown):
  err is z.infer<typeof endpointErrSchema> {
  return endpointErrSchema.safeParse(err).success;
}

const internalErrSchema = z.object({ message: z.string() });

export function getIsInternalError(err: unknown):
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
 * @param endpoint The RTK query endpoint. This endpoint must be
 *  handled in the
 *  {@link mapInternalErrToUserFriendlyErrMsg error message mapper function}
 * @param mapInternalErrToUserFriendlyErrMsg The function that maps the
 *  internal error to a user friendly error message
 * @returns A query function which handles the errors gracefully
 *  and in the format expected by RTK Query
 */
export function makeErrorableQueryFn<ReturnVal, Arg, Endpoints>(
  errorableFn: (arg: Arg) => Promise<ReturnVal>,
  endpoint: Endpoints,
  mapInternalErrToUserFriendlyErrMsg:
  (err: unknown, endpoint: Endpoints) => string,
): (arg: Arg) => Promise<{ data: ReturnVal } | { error: string }> {
  return async (arg) => {
    const trial = await tryItAsync(() => errorableFn(arg));
    if (!trial.success) {
      const userFriendlyError
        = mapInternalErrToUserFriendlyErrMsg(trial.err, endpoint);
      return { error: userFriendlyError };
    }
    return { data: trial.data };
  };
}
