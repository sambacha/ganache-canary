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
var _blockchain;
Object.defineProperty(exports, "__esModule", { value: true });
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const manager_1 = __importDefault(require("./manager"));
const utils_1 = require("@ganache/utils");
const filter_parsing_1 = require("../helpers/filter-parsing");
class BlockLogManager extends manager_1.default {
    constructor(base, blockchain) {
        super(base, ethereum_utils_1.BlockLogs);
        _blockchain.set(this, void 0);
        __classPrivateFieldSet(this, _blockchain, blockchain);
    }
    async get(key) {
        const log = await super.get(key);
        if (log) {
            log.blockNumber = utils_1.Quantity.from(key);
        }
        else if (__classPrivateFieldGet(this, _blockchain).fallback) {
            const block = utils_1.Quantity.from(key);
            const res = await __classPrivateFieldGet(this, _blockchain).fallback.request("eth_getLogs", [{ fromBlock: block, toBlock: block }]);
            return ethereum_utils_1.BlockLogs.fromJSON(res);
        }
        return log;
    }
    async getLogs(filter) {
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        if ("blockHash" in filter) {
            const { addresses, topics } = filter_parsing_1.parseFilterDetails(filter);
            const blockNumber = await blockchain.blocks.getNumberFromHash(filter.blockHash);
            if (!blockNumber)
                return [];
            const logs = await this.get(blockNumber);
            return logs ? [...logs.filter(addresses, topics)] : [];
        }
        else {
            const { addresses, topics, fromBlock, toBlockNumber } = filter_parsing_1.parseFilter(filter, blockchain);
            const pendingLogsPromises = [
                this.get(fromBlock.toBuffer())
            ];
            const fromBlockNumber = fromBlock.toNumber();
            // if we have a range of blocks to search, do that here:
            if (fromBlockNumber !== toBlockNumber) {
                // fetch all the blockLogs in-between `fromBlock` and `toBlock` (excluding
                // from, because we already started fetching that one)
                for (let i = fromBlockNumber + 1, l = toBlockNumber + 1; i < l; i++) {
                    pendingLogsPromises.push(this.get(utils_1.Quantity.from(i).toBuffer()));
                }
            }
            // now filter and compute all the blocks' blockLogs (in block order)
            return Promise.all(pendingLogsPromises).then(blockLogsRange => {
                const filteredBlockLogs = [];
                blockLogsRange.forEach(blockLogs => {
                    // TODO(perf): this loops over all addresses for every block.
                    // Maybe make it loop only once?
                    if (blockLogs)
                        filteredBlockLogs.push(...blockLogs.filter(addresses, topics));
                });
                return filteredBlockLogs;
            });
        }
    }
}
exports.default = BlockLogManager;
_blockchain = new WeakMap();
//# sourceMappingURL=blocklog-manager.js.map