"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockTransaction = void 0;
const frozen_transaction_1 = require("./frozen-transaction");
/**
 * A FrozenTransaction, whose _source_ is an existing Block
 */
class BlockTransaction extends frozen_transaction_1.FrozenTransaction {
    constructor(data, [from, hash], blockHash, blockNumber, index, common) {
        // Build a GanacheRawExtraTx from the data given to use by BlockRawTx and
        // the constructor args
        const extraRaw = [
            from,
            hash,
            blockHash,
            blockNumber,
            index
        ];
        super([data, extraRaw], common);
    }
}
exports.BlockTransaction = BlockTransaction;
//# sourceMappingURL=block-transaction.js.map