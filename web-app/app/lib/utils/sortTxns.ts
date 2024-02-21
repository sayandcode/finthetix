import { TypedContractEvent, TypedEventLog } from '~/contracts/types/common';

type Txn = TypedEventLog<TypedContractEvent>;

/**
 * This function sorts transactions according to the Javascript Array
 * sort specification
 *
 * @param txn1
 * @param txn2
 * @returns -1 if {@link txn1} occurred first, 1 if {@link txn2} occurred first
 */
export default function sortTxns(txn1: Txn, txn2: Txn) {
  if (txn1.blockNumber === txn2.blockNumber) {
    // sort by transaction index
    return txn1.transactionIndex > txn2.transactionIndex ? 1 : -1;
  }

  return txn1.blockNumber > txn2.blockNumber ? 1 : -1;
}
