/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

type MetamaskEventHandler<Name extends string, CallbackArgs extends unknown[]>
  = (eventName: Name, callback: (...args: CallbackArgs) => void) => void;

type AccountsChangedEventHandler = MetamaskEventHandler<'accountsChanged', [lastActiveAddresses: string[]]>;
type ChainChangedEventHandler = MetamaskEventHandler<'chainChanged', [newChainId: string]>;

interface Window {
  ethereum?:
    import('ethers').Eip1193Provider & {
      on: AccountsChangedEventHandler & ChainChangedEventHandler
      off: AccountsChangedEventHandler & ChainChangedEventHandler
    }
}
