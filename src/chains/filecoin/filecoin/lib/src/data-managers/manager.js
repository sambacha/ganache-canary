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
var _Type, _options;
Object.defineProperty(exports, "__esModule", { value: true });
const NOTFOUND = 404;
class Manager {
    constructor(base, type, options) {
        _Type.set(this, void 0);
        _options.set(this, void 0);
        __classPrivateFieldSet(this, _Type, type);
        __classPrivateFieldSet(this, _options, options);
        this.base = base;
    }
    async getRaw(key) {
        if (typeof key === "string" || typeof key === "number") {
            key = Buffer.from(`${key}`);
        }
        if (key.length === 0) {
            return null;
        }
        return this.base.get(key).catch(e => {
            if (e.status === NOTFOUND)
                return null;
            throw e;
        });
    }
    async get(key) {
        const raw = await this.getRaw(key);
        if (!raw)
            return null;
        return new (__classPrivateFieldGet(this, _Type))(JSON.parse(raw.toString()), __classPrivateFieldGet(this, _options));
    }
    async setRaw(key, value) {
        if (typeof key === "string" || typeof key === "number") {
            key = Buffer.from(`${key}`);
        }
        if (key.length === 0) {
            return;
        }
        return await this.base.put(key, value);
    }
    async set(key, value) {
        return await this.setRaw(key, Buffer.from(JSON.stringify(value.serialize())));
    }
    del(key) {
        return this.base.del(key);
    }
}
exports.default = Manager;
_Type = new WeakMap(), _options = new WeakMap();
//# sourceMappingURL=manager.js.map