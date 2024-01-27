/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

interface Window {
  ethereum?: import('ethers').Eip1193Provider
}
