"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForkCache = void 0;
const ethereumjs_util_1 = require("ethereumjs-util");
const cache_1 = __importDefault(require("@ethereumjs/vm/dist/state/cache"));
class ForkCache extends cache_1.default {
    constructor(trie) {
        super(trie);
        /**
         * Looks up address in underlying trie.
         * @param address - Address of account
         */
        this._lookupAccount = async (address) => {
            const rlp = await this._trie.get(address.buf);
            return ethereumjs_util_1.Account.fromRlpSerializedAccount(rlp);
        };
    }
}
exports.ForkCache = ForkCache;
//# sourceMappingURL=cache.js.map