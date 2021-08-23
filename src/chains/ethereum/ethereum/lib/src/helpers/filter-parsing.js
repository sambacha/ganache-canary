"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFilter = exports.parseFilterRange = exports.parseFilterDetails = void 0;
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const ethereum_address_1 = require("@ganache/ethereum-address");
function parseFilterDetails(filter) {
    // `filter.address` may be a single address or an array
    const addresses = filter.address
        ? (Array.isArray(filter.address)
            ? filter.address
            : [filter.address]).map(a => ethereum_address_1.Address.from(a.toLowerCase()).toBuffer())
        : [];
    const topics = filter.topics ? filter.topics : [];
    return { addresses, topics };
}
exports.parseFilterDetails = parseFilterDetails;
function parseFilterRange(filter, blockchain) {
    const latestBlock = blockchain.blocks.latest.header.number;
    const fromBlock = blockchain.blocks.getEffectiveNumber(filter.fromBlock || ethereum_utils_1.Tag.LATEST);
    const latestBlockNumber = latestBlock.toNumber();
    const toBlock = blockchain.blocks.getEffectiveNumber(filter.toBlock || ethereum_utils_1.Tag.LATEST);
    let toBlockNumber;
    // don't search after the "latest" block, unless it's "pending", of course.
    if (toBlock > latestBlock) {
        toBlockNumber = latestBlockNumber;
    }
    else {
        toBlockNumber = toBlock.toNumber();
    }
    return {
        fromBlock,
        toBlock,
        toBlockNumber
    };
}
exports.parseFilterRange = parseFilterRange;
function parseFilter(filter = { address: [], topics: [] }, blockchain) {
    const { addresses, topics } = parseFilterDetails(filter);
    const { fromBlock, toBlock, toBlockNumber } = parseFilterRange(filter, blockchain);
    return {
        addresses,
        fromBlock,
        toBlock,
        toBlockNumber,
        topics
    };
}
exports.parseFilter = parseFilter;
//# sourceMappingURL=filter-parsing.js.map