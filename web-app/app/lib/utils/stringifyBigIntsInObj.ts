/**
 * We can use this type to stringify all bigints in an object,
 * so that redux can properly serialize them
 */
export type WithStringifiedBigints<Obj> = {
  [K in keyof Obj]:
  Obj[K] extends bigint
    ? string
    : Obj[K] extends object
      ? WithStringifiedBigints<Obj[K]>
      : Obj[K];
};

export default function stringifyBigIntsInObj<Obj extends object>(obj: Obj):
WithStringifiedBigints<Obj> {
  return Object.fromEntries(
    Object
      .entries(obj)
      .map(([k, v]) => {
        const serializedVal = typeof v === 'bigint'
          ? v.toString()
          : typeof v === 'object'
            ? stringifyBigIntsInObj(v)
            : v;

        return [k, serializedVal];
      }),
  ) as WithStringifiedBigints<Obj>;
}
