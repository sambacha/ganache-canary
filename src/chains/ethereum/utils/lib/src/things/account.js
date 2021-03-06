"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const utils_1 = require("@ganache/utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const rlp_1 = require("@ganache/rlp");
const utils_2 = require("@ganache/utils");
class Account {
    constructor(address) {
        this.stateRoot = ethereumjs_util_1.KECCAK256_RLP;
        this.codeHash = ethereumjs_util_1.KECCAK256_NULL;
        this.address = address;
        this.balance = utils_2.RPCQUANTITY_EMPTY;
        this.nonce = utils_2.RPCQUANTITY_EMPTY;
    }
    static fromBuffer(buffer) {
        const account = Object.create(Account.prototype);
        const raw = rlp_1.decode(buffer);
        account.nonce = utils_1.Quantity.from(raw[0]);
        account.balance = utils_1.Quantity.from(raw[1]);
        account.stateRoot = raw[2];
        account.codeHash = raw[3];
        return account;
    }
    serialize() {
        return rlp_1.encode([
            this.nonce.toBuffer(),
            this.balance.toBuffer(),
            this.stateRoot,
            this.codeHash
        ]);
    }
}
exports.Account = Account;
//# sourceMappingURL=account.js.map