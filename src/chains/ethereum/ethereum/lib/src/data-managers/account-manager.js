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
var _blockchain;
Object.defineProperty(exports, "__esModule", { value: true });
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const utils_1 = require("@ganache/utils");
const rlp_1 = require("@ganache/rlp");
class AccountManager {
    constructor(blockchain) {
        _blockchain.set(this, void 0);
        __classPrivateFieldSet(this, _blockchain, blockchain);
    }
    async get(address, blockNumber = ethereum_utils_1.Tag.LATEST) {
        const raw = await this.getRaw(address, blockNumber);
        if (raw == null)
            return null;
        return ethereum_utils_1.Account.fromBuffer(raw);
    }
    async getRaw(address, blockNumber = ethereum_utils_1.Tag.LATEST) {
        const { trie, blocks } = __classPrivateFieldGet(this, _blockchain);
        // get the block, its state root, and the trie at that state root
        const { stateRoot, number } = (await blocks.get(blockNumber)).header;
        const trieCopy = trie.copy(false);
        trieCopy.setContext(stateRoot.toBuffer(), null, number);
        // get the account from the trie
        return await trieCopy.get(address.toBuffer());
    }
    async getStorageAt(address, key, blockNumber = ethereum_utils_1.Tag.LATEST) {
        const { trie, blocks } = __classPrivateFieldGet(this, _blockchain);
        // get the block, its state root, and the trie at that state root
        const { stateRoot, number } = (await blocks.get(blockNumber)).header;
        const trieCopy = trie.copy(false);
        trieCopy.setContext(stateRoot.toBuffer(), address.toBuffer(), number);
        // get the account from the trie
        return await trieCopy.get(key);
    }
    async getNonce(address, blockNumber = ethereum_utils_1.Tag.LATEST) {
        const data = await this.getRaw(address, blockNumber);
        if (data == null)
            return utils_1.RPCQUANTITY_ZERO;
        const [nonce] = rlp_1.decode(data);
        return nonce.length === 0 ? utils_1.RPCQUANTITY_ZERO : utils_1.Quantity.from(nonce);
    }
    async getBalance(address, blockNumber = ethereum_utils_1.Tag.LATEST) {
        const data = await this.getRaw(address, blockNumber);
        if (data == null)
            return utils_1.RPCQUANTITY_ZERO;
        const [, balance] = rlp_1.decode(data);
        return balance.length === 0 ? utils_1.RPCQUANTITY_ZERO : utils_1.Quantity.from(balance);
    }
    async getCode(address, blockNumber = ethereum_utils_1.Tag.LATEST) {
        const data = await this.getRaw(address, blockNumber);
        if (data == null)
            return utils_1.Data.from(utils_1.BUFFER_EMPTY);
        const [, , , codeHash] = rlp_1.decode(data);
        if (codeHash.equals(ethereumjs_util_1.KECCAK256_NULL))
            return utils_1.Data.from(utils_1.BUFFER_EMPTY);
        else
            return __classPrivateFieldGet(this, _blockchain).trie.db.get(codeHash).then(utils_1.Data.from);
    }
}
exports.default = AccountManager;
_blockchain = new WeakMap();
//# sourceMappingURL=account-manager.js.map