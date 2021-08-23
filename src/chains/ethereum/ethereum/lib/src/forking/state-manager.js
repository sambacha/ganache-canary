"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForkStateManager = void 0;
const rlp_1 = require("rlp");
const stateManager_1 = __importDefault(require("@ethereumjs/vm/dist/state/stateManager"));
const cache_1 = require("./cache");
/**
 * Interface for getting and setting data from an underlying
 * state trie.
 */
class ForkStateManager extends stateManager_1.default {
    /**
     * Instantiate the StateManager interface.
     */
    constructor(opts) {
        super(opts);
        this._cache = new cache_1.ForkCache(opts.trie);
    }
    /**
     * Copies the current instance of the `StateManager`
     * at the last fully committed point, i.e. as if all current
     * checkpoints were reverted.
     */
    copy() {
        return new ForkStateManager({
            trie: this._trie.copy(false),
            common: this._common
        });
    }
    /**
     * Creates a storage trie from the primary storage trie
     * for an account and saves this in the storage cache.
     * @private
     */
    async _lookupStorageTrie(address) {
        // from state trie
        const account = await this.getAccount(address);
        const storageTrie = this._trie.copy(false);
        storageTrie.setContext(account.stateRoot, address.buf, storageTrie.blockNumber);
        storageTrie.db.checkpoints = [];
        return storageTrie;
    }
    /**
     * Gets the storage value associated with the provided `address` and `key`. This method returns
     * the shortest representation of the stored value.
     * @param address -  Address of the account to get the storage for
     * @param key - Key in the account's storage to get the value for. Must be 32 bytes long.
     * @returns {Promise<Buffer>} - The storage value for the account
     * corresponding to the provided address at the provided key.
     * If this does not exist an empty `Buffer` is returned.
     */
    async getContractStorage(address, key) {
        const trie = (await this._getStorageTrie(address));
        const value = await trie.get(key);
        return rlp_1.decode(value);
    }
}
exports.ForkStateManager = ForkStateManager;
//# sourceMappingURL=state-manager.js.map