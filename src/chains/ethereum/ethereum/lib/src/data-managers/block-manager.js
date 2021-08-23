"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _blockchain, _common, _blockIndexes;
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const utils_1 = require("@ganache/utils");
const ethereum_block_1 = require("@ganache/ethereum-block");
const NOTFOUND = 404;
const EMPTY_BUFFER = Buffer.from([]);
class BlockManager extends manager_1.default {
    constructor(blockchain, common, blockIndexes, base) {
        super(base, ethereum_block_1.Block, common);
        _blockchain.set(this, void 0);
        _common.set(this, void 0);
        _blockIndexes.set(this, void 0);
        this.fromFallback = async (tagOrBlockNumber) => {
            const fallback = __classPrivateFieldGet(this, _blockchain).fallback;
            const json = await fallback.request("eth_getBlockByNumber", [
                typeof tagOrBlockNumber === "string"
                    ? tagOrBlockNumber
                    : utils_1.Quantity.from(tagOrBlockNumber).toString(),
                true
            ]);
            return json == null ? null : ethereum_block_1.Block.rawFromJSON(json);
        };
        __classPrivateFieldSet(this, _blockchain, blockchain);
        __classPrivateFieldSet(this, _common, common);
        __classPrivateFieldSet(this, _blockIndexes, blockIndexes);
    }
    static async initialize(blockchain, common, blockIndexes, base) {
        const bm = new BlockManager(blockchain, common, blockIndexes, base);
        await bm.updateTaggedBlocks();
        return bm;
    }
    getBlockByTag(tag) {
        switch (ethereum_utils_1.Tag.normalize(tag)) {
            case ethereum_utils_1.Tag.LATEST:
                return this.latest;
            case void 0:
            case null:
                // the key is probably a hex string, let nature takes its course.
                break;
            case ethereum_utils_1.Tag.PENDING:
                // TODO: build a real pending block!
                return this.latest; // this.createBlock(this.latest.header);
            case ethereum_utils_1.Tag.EARLIEST:
                return this.earliest;
            default:
                // this probably can't happen. but if someone passed something like
                // `toString` in as a block tag and it got this far... maybe we'd
                // get here...
                throw new Error(`Invalid block Tag: ${tag}`);
        }
    }
    getEffectiveNumber(tagOrBlockNumber = ethereum_utils_1.Tag.LATEST) {
        if (typeof tagOrBlockNumber === "string") {
            const block = this.getBlockByTag(tagOrBlockNumber);
            if (block) {
                return block.header.number;
            }
        }
        return utils_1.Quantity.from(tagOrBlockNumber);
    }
    async getNumberFromHash(hash) {
        return __classPrivateFieldGet(this, _blockIndexes).get(utils_1.Data.from(hash).toBuffer()).catch(e => {
            if (e.status === NOTFOUND)
                return null;
            throw e;
        });
    }
    async getByHash(hash) {
        const number = await this.getNumberFromHash(hash);
        if (number === null) {
            if (__classPrivateFieldGet(this, _blockchain).fallback) {
                const fallback = __classPrivateFieldGet(this, _blockchain).fallback;
                const json = await fallback.request("eth_getBlockByHash", [
                    utils_1.Data.from(hash),
                    true
                ]);
                if (json && BigInt(json.number) <= fallback.blockNumber.toBigInt()) {
                    return new ethereum_block_1.Block(ethereum_block_1.Block.rawFromJSON(json), __classPrivateFieldGet(this, _common));
                }
                else {
                    return null;
                }
            }
            else {
                return null;
            }
        }
        else {
            return this.get(number);
        }
    }
    async getRawByBlockNumber(blockNumber) {
        // TODO(perf): make the block's raw fields accessible on latest/earliest/pending so
        // we don't have to fetch them from the db each time a block tag is used.
        const fallback = __classPrivateFieldGet(this, _blockchain).fallback;
        const numBuf = blockNumber.toBuffer();
        return this.getRaw(numBuf).then(block => {
            if (block == null && fallback) {
                return this.fromFallback(fallback.selectValidForkBlockNumber(blockNumber).toBuffer());
            }
            return block;
        });
    }
    async get(tagOrBlockNumber) {
        if (typeof tagOrBlockNumber === "string") {
            const block = this.getBlockByTag(tagOrBlockNumber);
            if (block)
                return block;
        }
        const block = await this.getRawByBlockNumber(utils_1.Quantity.from(tagOrBlockNumber));
        if (block)
            return new ethereum_block_1.Block(block, __classPrivateFieldGet(this, _common));
        throw new Error("header not found");
    }
    /**
     * Writes the block object to the underlying database.
     * @param block
     */
    async putBlock(number, hash, serialized) {
        let key = number;
        // ensure we can store Block #0 as key "00", not ""
        if (EMPTY_BUFFER.equals(key)) {
            key = Buffer.from([0]);
        }
        const secondaryKey = hash.toBuffer();
        await Promise.all([
            __classPrivateFieldGet(this, _blockIndexes).put(secondaryKey, key),
            super.set(key, serialized)
        ]);
    }
    updateTaggedBlocks() {
        return new Promise((resolve, reject) => {
            this.base
                .createValueStream({ limit: 1 })
                .on("data", (data) => {
                this.earliest = new ethereum_block_1.Block(data, __classPrivateFieldGet(this, _common));
            })
                .on("error", (err) => {
                reject(err);
            })
                .on("end", () => {
                resolve(void 0);
            });
            this.base
                .createValueStream({ reverse: true, limit: 1 })
                .on("data", (data) => {
                this.latest = new ethereum_block_1.Block(data, __classPrivateFieldGet(this, _common));
            })
                .on("error", (err) => {
                reject(err);
            })
                .on("end", () => {
                resolve(void 0);
            });
        });
    }
}
exports.default = BlockManager;
_blockchain = new WeakMap(), _common = new WeakMap(), _blockIndexes = new WeakMap();
//# sourceMappingURL=block-manager.js.map