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
var _privateKeyManager, _database;
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const account_1 = require("../things/account");
const address_1 = require("../things/address");
class AccountManager extends manager_1.default {
    constructor(base, privateKeyManager, database) {
        super(base, account_1.Account);
        _privateKeyManager.set(this, void 0);
        _database.set(this, void 0);
        // the account manager doesn't handle private keys directly
        // we need to use the private key manager for that
        __classPrivateFieldSet(this, _privateKeyManager, privateKeyManager);
        __classPrivateFieldSet(this, _database, database);
    }
    static async initialize(base, privateKeyManager, database) {
        const manager = new AccountManager(base, privateKeyManager, database);
        return manager;
    }
    // TODO(perf): (Issue ganache#876) There's probably a bit of
    // performance optimizations that could be done here. putAccount
    // is called whenever the account changes (balance, nonce,
    // private key)
    async putAccount(account) {
        await __classPrivateFieldGet(this, _database).batch(() => {
            super.set(account.address.value, account);
            if (account.address.privateKey) {
                __classPrivateFieldGet(this, _privateKeyManager).putPrivateKey(account.address.value, account.address.privateKey);
            }
        });
    }
    async getAccount(address) {
        let account = await super.get(address);
        if (!account) {
            account = new account_1.Account({
                address: new address_1.Address(address)
            });
            await this.putAccount(account);
        }
        const privateKey = await __classPrivateFieldGet(this, _privateKeyManager).getPrivateKey(account.address.value);
        if (privateKey) {
            account.address.setPrivateKey(privateKey);
        }
        return account;
    }
    /**
     * Returns an array of accounts which we have private keys
     * for. The order is the order in which they were stored.
     * To add a controllable account, use `AccountManager.putAccount(account)`
     * where `account.address.privateKey` is set.
     */
    async getControllableAccounts() {
        const addresses = __classPrivateFieldGet(this, _privateKeyManager).addressesWithPrivateKeys;
        const accounts = await Promise.all(addresses.map(async (address) => await this.getAccount(address)));
        return accounts;
    }
    async mintFunds(address, amount) {
        const account = await this.getAccount(address);
        account.addBalance(amount);
        await this.putAccount(account);
    }
    async transferFunds(from, to, amount) {
        const fromAccount = await this.getAccount(from);
        const toAccount = await this.getAccount(to);
        if (fromAccount.balance.value >= amount) {
            fromAccount.subtractBalance(amount);
            toAccount.addBalance(amount);
            await this.putAccount(fromAccount);
            await this.putAccount(toAccount);
            return true;
        }
        else {
            return false;
        }
    }
    async incrementNonce(address) {
        const account = await this.getAccount(address);
        account.nonce++;
        await this.putAccount(account);
    }
}
exports.default = AccountManager;
_privateKeyManager = new WeakMap(), _database = new WeakMap();
//# sourceMappingURL=account-manager.js.map