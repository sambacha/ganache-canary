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
var _addressesWithPrivateKeys;
Object.defineProperty(exports, "__esModule", { value: true });
const NOTFOUND = 404;
class PrivateKeyManager {
    constructor(base, addressesWithPrivateKeys) {
        _addressesWithPrivateKeys.set(this, void 0);
        this.base = base;
        __classPrivateFieldSet(this, _addressesWithPrivateKeys, addressesWithPrivateKeys);
    }
    get addressesWithPrivateKeys() {
        return __classPrivateFieldGet(this, _addressesWithPrivateKeys);
    }
    static async initialize(base) {
        let addressesWithPrivateKeys;
        try {
            const result = await base.get(PrivateKeyManager.AccountsWithPrivateKeysKey);
            addressesWithPrivateKeys = JSON.parse(result.toString());
        }
        catch (e) {
            if (e.status === NOTFOUND) {
                // if the array doesn't exist yet, initialize it
                addressesWithPrivateKeys = [];
                await base.put(PrivateKeyManager.AccountsWithPrivateKeysKey, Buffer.from(JSON.stringify(addressesWithPrivateKeys)));
            }
            else {
                throw e;
            }
        }
        const manager = new PrivateKeyManager(base, addressesWithPrivateKeys);
        return manager;
    }
    async getPrivateKey(address) {
        address = address.toLowerCase();
        try {
            const privateKey = await this.base.get(Buffer.from(address));
            return privateKey.toString("hex");
        }
        catch (e) {
            if (e.status === NOTFOUND) {
                return null;
            }
            throw e;
        }
    }
    /**
     * NOTE: This function should only be called from
     * `AccountManager.putAccount` to ensure fields are written
     * atomically. Only call this function if you know what you're doing.
     */
    putPrivateKey(address, privateKey) {
        address = address.toLowerCase();
        this.base.put(Buffer.from(address), Buffer.from(privateKey, "hex"));
        if (!__classPrivateFieldGet(this, _addressesWithPrivateKeys).includes(address)) {
            __classPrivateFieldGet(this, _addressesWithPrivateKeys).push(address);
            // TODO(perf): (Issue ganache#875) If the number of private
            // keys becomes very large (a highly unlikely event), this would
            // kill performance whenever accounts were created
            this.base.put(PrivateKeyManager.AccountsWithPrivateKeysKey, Buffer.from(JSON.stringify(__classPrivateFieldGet(this, _addressesWithPrivateKeys))));
        }
    }
    async hasPrivateKey(address) {
        address = address.toLowerCase();
        return __classPrivateFieldGet(this, _addressesWithPrivateKeys).includes(address);
    }
    async deletePrivateKey(address) {
        address = address.toLowerCase();
        if (__classPrivateFieldGet(this, _addressesWithPrivateKeys).includes(address)) {
            __classPrivateFieldSet(this, _addressesWithPrivateKeys, __classPrivateFieldGet(this, _addressesWithPrivateKeys).filter(a => a !== address));
            this.base.del(Buffer.from(address));
            // TODO(perf): (Issue ganache#875) If the number of private
            // keys becomes very large (a highly unlikely event), this would
            // kill performance whenever accounts were created
            await this.base.put(PrivateKeyManager.AccountsWithPrivateKeysKey, Buffer.from(JSON.stringify(__classPrivateFieldGet(this, _addressesWithPrivateKeys))));
        }
    }
    async setDefault(address) {
        address = address.toLowerCase();
        if (this.hasPrivateKey(address)) {
            __classPrivateFieldSet(this, _addressesWithPrivateKeys, __classPrivateFieldGet(this, _addressesWithPrivateKeys).filter(a => a !== address));
            __classPrivateFieldGet(this, _addressesWithPrivateKeys).unshift(address);
            // TODO(perf): (Issue ganache#875) If the number of private
            // keys becomes very large (a highly unlikely event), this would
            // kill performance whenever accounts were created
            await this.base.put(PrivateKeyManager.AccountsWithPrivateKeysKey, Buffer.from(JSON.stringify(__classPrivateFieldGet(this, _addressesWithPrivateKeys))));
        }
        else {
            throw new Error(`Cannot set ${address} as the default address as it's not part of the wallet.`);
        }
    }
}
exports.default = PrivateKeyManager;
_addressesWithPrivateKeys = new WeakMap();
PrivateKeyManager.AccountsWithPrivateKeysKey = Buffer.from("accounts-with-private-keys");
//# sourceMappingURL=private-key-manager.js.map