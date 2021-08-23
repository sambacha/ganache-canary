"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTransactions = void 0;
/**
 * Runs the given transactions, unchecked, through the VM with the given block.
 *
 * The method does not create a `checkpoint` or `commit`/`revert`.
 *
 * @param vm
 * @param transactions
 * @param block
 */
async function runTransactions(vm, transactions, block) {
    for (let i = 0, l = transactions.length; i < l; i++) {
        await vm
            .runTx({
            tx: transactions[i],
            block: block
        })
            // we ignore transactions that error because we just want to _run_ these,
            // transactions just to update the blockchain's state
            .catch(() => { });
    }
}
exports.runTransactions = runTransactions;
//# sourceMappingURL=run-transactions.js.map