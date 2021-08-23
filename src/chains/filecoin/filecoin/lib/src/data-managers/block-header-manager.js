"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const block_header_1 = require("../things/block-header");
class BlockHeaderManager extends manager_1.default {
    static async initialize(base) {
        const manager = new BlockHeaderManager(base);
        return manager;
    }
    constructor(base) {
        super(base, block_header_1.BlockHeader);
    }
    /**
     * Writes the blockHeader object to the underlying database.
     * @param blockHeader
     */
    async putBlockHeader(blockHeader) {
        await super.set(blockHeader.cid.value, blockHeader);
    }
}
exports.default = BlockHeaderManager;
//# sourceMappingURL=block-header-manager.js.map