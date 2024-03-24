import getServerEnv from '~/lib/env';
import { BlockExplorerInfo } from './schema';

export default function getBlockExplorerInfo(): BlockExplorerInfo {
  const { BLOCK_EXPLORER_ADDRESS_URL, BLOCK_EXPLORER_TX_URL } = getServerEnv();
  return {
    txUrl: BLOCK_EXPLORER_TX_URL,
    addressUrl: BLOCK_EXPLORER_ADDRESS_URL,
  };
}
