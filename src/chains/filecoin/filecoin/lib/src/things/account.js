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
var _balance;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const utils_1 = require("@ganache/utils");
const address_1 = require("./address");
const balance_1 = require("./balance");
const serializable_object_1 = require("./serializable-object");
class Account extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        _balance.set(this, void 0);
        this.address = super.initializeValue(this.config.address, options);
        __classPrivateFieldSet(this, _balance, super.initializeValue(this.config.balance, options));
        this.nonce = super.initializeValue(this.config.nonce, options);
    }
    get config() {
        return {
            address: {
                deserializedName: "address",
                serializedName: "Address",
                defaultValue: literal => literal ? new address_1.Address(literal) : address_1.Address.random()
            },
            balance: {
                deserializedName: "balance",
                serializedName: "Balance",
                defaultValue: literal => literal ? new balance_1.Balance(literal) : new balance_1.Balance("0")
            },
            nonce: {
                deserializedName: "nonce",
                serializedName: "Nonce",
                defaultValue: 0
            }
        };
    }
    static random(defaultFIL, rng = new utils_1.RandomNumberGenerator(), protocol = address_1.AddressProtocol.BLS, network = address_1.AddressNetwork.Testnet) {
        return new Account({
            address: address_1.Address.random(rng, protocol, network),
            balance: new balance_1.Balance(balance_1.Balance.FILToLowestDenomination(defaultFIL).toString()),
            nonce: 0
        });
    }
    addBalance(val) {
        __classPrivateFieldGet(this, _balance).add(val);
    }
    subtractBalance(val) {
        __classPrivateFieldGet(this, _balance).sub(val);
    }
    get balance() {
        return __classPrivateFieldGet(this, _balance);
    }
}
exports.Account = Account;
_balance = new WeakMap();
//# sourceMappingURL=account.js.map