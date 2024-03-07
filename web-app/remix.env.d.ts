/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

type AccountsChangedEventName = 'accountsChanged';

interface Window {
  ethereum?:
    import('ethers').Eip1193Provider & {
      on: (
        eventName: AccountsChangedEventName,
        callbackFn: (lastActiveAddresses: string[]) => void
      ) => void
      off: (
        eventName: AccountsChangedEventName,
        callbackFn: (lastActiveAddresses: string[]) => void
      ) => void
    }
}
