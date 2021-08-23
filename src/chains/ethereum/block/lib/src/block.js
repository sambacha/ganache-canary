"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const utils_1 = require("@ganache/utils");
const ethereum_transaction_1 = require("@ganache/ethereum-transaction");
const rlp_1 = require("@ganache/rlp");
const runtime_block_1 = require("./runtime-block");
const utils_2 = require("@ganache/utils");
const serialize_1 = require("./serialize");
const ethereum_address_1 = require("@ganache/ethereum-address");
class Block {
    constructor(serialized, common) {
        this._common = common;
        if (serialized) {
            const deserialized = rlp_1.decode(serialized);
            this._raw = deserialized[0];
            this._rawTransactions = deserialized[1] || [];
            // TODO: support actual uncle data (needed for forking!)
            // Issue: https://github.com/trufflesuite/ganache/issues/786
            // const uncles = deserialized[2];
            const totalDifficulty = deserialized[3];
            this.header = runtime_block_1.makeHeader(this._raw, totalDifficulty);
            this._rawTransactionMetaData = deserialized[4] || [];
            this._size = utils_1.Quantity.from(deserialized[5]).toNumber();
        }
    }
    hash() {
        return (this._hash || (this._hash = utils_1.Data.from(utils_2.keccak(rlp_1.encode(this._raw)), 32)));
    }
    getTransactions() {
        const common = this._common;
        return this._rawTransactions.map((raw, index) => new ethereum_transaction_1.BlockTransaction(raw, this._rawTransactionMetaData[index], this.hash().toBuffer(), this.header.number.toBuffer(), utils_1.Quantity.from(index).toBuffer(), common));
    }
    toJSON(includeFullTransactions = false) {
        const hash = this.hash();
        const txFn = this.getTxFn(includeFullTransactions);
        const hashBuffer = hash.toBuffer();
        const number = this.header.number.toBuffer();
        const common = this._common;
        const jsonTxs = this._rawTransactions.map((raw, index) => {
            const tx = new ethereum_transaction_1.BlockTransaction(raw, this._rawTransactionMetaData[index], hashBuffer, number, utils_1.Quantity.from(index).toBuffer(), common);
            return txFn(tx);
        });
        return {
            hash,
            ...this.header,
            size: utils_1.Quantity.from(this._size),
            transactions: jsonTxs,
            uncles: [] // this.value.uncleHeaders.map(function(uncleHash) {return to.hex(uncleHash)})
        };
    }
    static rawFromJSON(json) {
        const header = [
            utils_1.Data.from(json.parentHash).toBuffer(),
            utils_1.Data.from(json.sha3Uncles).toBuffer(),
            ethereum_address_1.Address.from(json.miner).toBuffer(),
            utils_1.Data.from(json.stateRoot).toBuffer(),
            utils_1.Data.from(json.transactionsRoot).toBuffer(),
            utils_1.Data.from(json.receiptsRoot).toBuffer(),
            utils_1.Data.from(json.logsBloom).toBuffer(),
            utils_1.Quantity.from(json.difficulty).toBuffer(),
            utils_1.Quantity.from(json.number).toBuffer(),
            utils_1.Quantity.from(json.gasLimit).toBuffer(),
            utils_1.Quantity.from(json.gasUsed).toBuffer(),
            utils_1.Quantity.from(json.timestamp).toBuffer(),
            utils_1.Data.from(json.extraData).toBuffer(),
            utils_1.Data.from(json.mixHash).toBuffer(),
            utils_1.Data.from(json.nonce).toBuffer()
        ];
        const totalDifficulty = utils_1.Quantity.from(json.totalDifficulty).toBuffer();
        const txs = [];
        const extraTxs = [];
        json.transactions.forEach(tx => {
            txs.push([
                utils_1.Quantity.from(tx.nonce).toBuffer(),
                utils_1.Quantity.from(tx.gasPrice).toBuffer(),
                utils_1.Quantity.from(tx.gas).toBuffer(),
                tx.to == null ? utils_2.BUFFER_EMPTY : ethereum_address_1.Address.from(tx.to).toBuffer(),
                utils_1.Quantity.from(tx.value).toBuffer(),
                utils_1.Data.from(tx.input).toBuffer(),
                utils_1.Quantity.from(tx.v).toBuffer(),
                utils_1.Quantity.from(tx.r).toBuffer(),
                utils_1.Quantity.from(tx.s).toBuffer()
            ]);
            extraTxs.push([
                utils_1.Quantity.from(tx.from).toBuffer(),
                utils_1.Quantity.from(tx.hash).toBuffer()
            ]);
        });
        return serialize_1.serialize([header, txs, [], totalDifficulty, extraTxs]).serialized;
    }
    getTxFn(include = false) {
        if (include) {
            return (tx) => tx.toJSON();
        }
        else {
            return (tx) => tx.hash;
        }
    }
    static fromParts(rawHeader, txs, totalDifficulty, extraTxs, size, common) {
        const block = new Block(null, common);
        block._raw = rawHeader;
        block._rawTransactions = txs;
        block.header = runtime_block_1.makeHeader(rawHeader, totalDifficulty);
        block._rawTransactionMetaData = extraTxs;
        block._size = size;
        return block;
    }
}
exports.Block = Block;
//# sourceMappingURL=block.js.map