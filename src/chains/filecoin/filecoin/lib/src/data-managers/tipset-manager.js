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
var _blockHeaderManager;
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const tipset_1 = require("../things/tipset");
class TipsetManager extends manager_1.default {
    constructor(base, blockHeaderManager) {
        super(base, tipset_1.Tipset);
        /**
         * The earliest tipset
         */
        this.earliest = null;
        /**
         * The latest tipset
         */
        this.latest = null;
        _blockHeaderManager.set(this, void 0);
        __classPrivateFieldSet(this, _blockHeaderManager, blockHeaderManager);
    }
    static async initialize(base, blockHeaderManager) {
        const manager = new TipsetManager(base, blockHeaderManager);
        return manager;
    }
    /**
     * Writes the tipset object to the underlying database.
     * @param tipset
     */
    async putTipset(tipset) {
        // remove blocks array here as they'll be stored in their own manager
        const tipsetWithoutBlocks = new tipset_1.Tipset({
            height: tipset.height,
            cids: tipset.cids
        });
        await super.set(tipset.height, tipsetWithoutBlocks);
        for (const block of tipset.blocks) {
            await __classPrivateFieldGet(this, _blockHeaderManager).putBlockHeader(block);
        }
        this.latest = tipset;
    }
    async getTipsetWithBlocks(height) {
        const tipset = await super.get(height);
        if (tipset === null) {
            return null;
        }
        await this.fillTipsetBlocks(tipset);
        return tipset;
    }
    async fillTipsetBlocks(tipset) {
        if (tipset.blocks.length === tipset.cids.length) {
            // don't bother fetching blocks if we already have the amount we need
            return;
        }
        // if we don't have all of them, let's refetch all even if we have some
        // we shouldn't really have a some, but not all, case. however, this ensures
        // we get all of the blocks and they're in the correct order
        tipset.blocks = [];
        for (const cid of tipset.cids) {
            const cidString = cid.root.value;
            const blockHeader = await __classPrivateFieldGet(this, _blockHeaderManager).get(Buffer.from(cidString));
            if (!blockHeader) {
                throw new Error(`Could not find block with cid ${cidString} for tipset ${tipset.height}`);
            }
            tipset.blocks.push(blockHeader);
        }
    }
}
exports.default = TipsetManager;
_blockHeaderManager = new WeakMap();
//# sourceMappingURL=tipset-manager.js.map