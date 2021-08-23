"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrozenTransaction = void 0;
const utils_1 = require("@ganache/utils");
const rlp_1 = require("@ganache/rlp");
const base_transaction_1 = require("./base-transaction");
const ethereum_address_1 = require("@ganache/ethereum-address");
/**
 * A frozen transaction is a transaction that is part of a block.
 */
class FrozenTransaction extends base_transaction_1.BaseTransaction {
    constructor(data, common) {
        super(common);
        this.toJSON = () => {
            return {
                hash: this.hash,
                nonce: this.nonce,
                blockHash: this.blockHash,
                blockNumber: this.blockNumber,
                transactionIndex: this.index,
                from: this.from,
                to: this.to.isNull() ? null : this.to,
                value: this.value,
                gas: this.gas,
                gasPrice: this.gasPrice,
                input: this.data,
                v: this.v,
                r: this.r,
                s: this.s
            };
        };
        if (Buffer.isBuffer(data)) {
            const decoded = rlp_1.decode(data);
            this.setRaw(decoded[0]);
            this.setExtra(decoded[1]);
        }
        else {
            this.setRaw(data[0]);
            this.setExtra(data[1]);
        }
        Object.freeze(this);
    }
    setRaw(raw) {
        const [nonce, gasPrice, gasLimit, to, value, data, v, r, s] = raw;
        this.nonce = utils_1.Quantity.from(nonce);
        this.gasPrice = utils_1.Quantity.from(gasPrice);
        this.gas = utils_1.Quantity.from(gasLimit);
        this.to = to.length === 0 ? utils_1.RPCQUANTITY_EMPTY : ethereum_address_1.Address.from(to);
        this.value = utils_1.Quantity.from(value);
        this.data = utils_1.Data.from(data);
        this.v = utils_1.Quantity.from(v, true);
        this.r = utils_1.Quantity.from(r, true);
        this.s = utils_1.Quantity.from(s, true);
    }
    setExtra(raw) {
        const [from, hash, blockHash, blockNumber, index] = raw;
        this.from = ethereum_address_1.Address.from(from);
        this.hash = utils_1.Data.from(hash, 32);
        this.blockHash = utils_1.Data.from(blockHash, 32);
        this.blockNumber = utils_1.Quantity.from(blockNumber);
        this.index = utils_1.Quantity.from(index);
    }
}
exports.FrozenTransaction = FrozenTransaction;
//# sourceMappingURL=frozen-transaction.js.map