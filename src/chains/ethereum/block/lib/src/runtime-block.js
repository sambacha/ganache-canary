"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeBlock = exports.makeHeader = exports.getBlockSize = void 0;
const utils_1 = require("@ganache/utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const serialize_1 = require("./serialize");
const block_1 = require("./block");
/**
 * BN, but with an extra `buf` property that caches the original Buffer value
 * we pass in.
 */
class BnExtra extends ethereumjs_util_1.BN {
    constructor(number) {
        super(number, 10, "be");
        this.buf = number;
    }
}
/**
 * Returns the size of the serialized data as it would have been calculated had
 * we stored things geth does, i.e., `totalDfficulty` is not usually stored in
 * the block header.
 *
 * @param serialized
 * @param totalDifficulty
 */
function getBlockSize(serialized, totalDifficulty) {
    return serialized.length - totalDifficulty.length;
}
exports.getBlockSize = getBlockSize;
function makeHeader(raw, totalDifficulty) {
    return {
        parentHash: utils_1.Data.from(raw[0], 32),
        sha3Uncles: utils_1.Data.from(raw[1], 32),
        miner: utils_1.Data.from(raw[2], 20),
        stateRoot: utils_1.Data.from(raw[3], 32),
        transactionsRoot: utils_1.Data.from(raw[4], 32),
        receiptsRoot: utils_1.Data.from(raw[5], 32),
        logsBloom: utils_1.Data.from(raw[6], 256),
        difficulty: utils_1.Quantity.from(raw[7], false),
        number: utils_1.Quantity.from(raw[8], false),
        gasLimit: utils_1.Quantity.from(raw[9], false),
        gasUsed: utils_1.Quantity.from(raw[10], false),
        timestamp: utils_1.Quantity.from(raw[11], false),
        extraData: utils_1.Data.from(raw[12]),
        mixHash: utils_1.Data.from(raw[13], 32),
        nonce: utils_1.Data.from(raw[14], 8),
        totalDifficulty: utils_1.Quantity.from(totalDifficulty, false)
    };
}
exports.makeHeader = makeHeader;
/**
 * A minimal block that can be used by the EVM to run transactions.
 */
class RuntimeBlock {
    constructor(number, parentHash, coinbase, gasLimit, timestamp, difficulty, previousBlockTotalDifficulty) {
        const ts = timestamp.toBuffer();
        const coinbaseBuffer = coinbase.toBuffer();
        this.header = {
            parentHash: parentHash.toBuffer(),
            coinbase: { buf: coinbaseBuffer, toBuffer: () => coinbaseBuffer },
            number: new BnExtra(number.toBuffer()),
            difficulty: new BnExtra(difficulty.toBuffer()),
            totalDifficulty: utils_1.Quantity.from(previousBlockTotalDifficulty.toBigInt() + difficulty.toBigInt()).toBuffer(),
            gasLimit: new BnExtra(gasLimit),
            timestamp: new BnExtra(ts)
        };
    }
    /**
     * Returns the serialization of all block data, the hash of the block header,
     * and a map of the hashed and raw storage keys
     *
     * @param transactionsTrie
     * @param receiptTrie
     * @param bloom
     * @param stateRoot
     * @param gasUsed
     * @param extraData
     * @param transactions
     * @param storageKeys
     */
    finalize(transactionsTrie, receiptTrie, bloom, stateRoot, gasUsed, extraData, transactions, storageKeys) {
        const { header } = this;
        const rawHeader = [
            header.parentHash,
            ethereumjs_util_1.KECCAK256_RLP_ARRAY,
            header.coinbase.buf,
            stateRoot,
            transactionsTrie,
            receiptTrie,
            bloom,
            header.difficulty.buf,
            header.number.buf,
            header.gasLimit.buf,
            gasUsed === 0n ? utils_1.BUFFER_EMPTY : utils_1.Quantity.from(gasUsed).toBuffer(),
            header.timestamp.buf,
            extraData.toBuffer(),
            utils_1.BUFFER_32_ZERO,
            utils_1.BUFFER_8_ZERO // nonce
        ];
        const { totalDifficulty } = header;
        const txs = [];
        const extraTxs = [];
        transactions.forEach(tx => {
            txs.push(tx.raw);
            extraTxs.push([tx.from.toBuffer(), tx.hash.toBuffer()]);
        });
        const { serialized, size } = serialize_1.serialize([
            rawHeader,
            txs,
            [],
            totalDifficulty,
            extraTxs
        ]);
        // make a new block, but pass `null` so it doesn't do the extra
        // deserialization work since we already have everything in a deserialized
        // state here. We'll just set it ourselves by reaching into the "_private"
        // fields.
        const block = new block_1.Block(null, null);
        block._raw = rawHeader;
        block._rawTransactions = txs;
        block.header = makeHeader(rawHeader, totalDifficulty);
        block._rawTransactionMetaData = extraTxs;
        block._size = size;
        return {
            block,
            serialized,
            storageKeys,
            transactions
        };
    }
}
exports.RuntimeBlock = RuntimeBlock;
//# sourceMappingURL=runtime-block.js.map