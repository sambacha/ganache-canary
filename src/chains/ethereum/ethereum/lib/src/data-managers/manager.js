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
const utils_1 = require("@ganache/utils");
const NOTFOUND = 404;
class Manager {
    constructor(base, type, options) {
        _Type.set(this, void 0);
        _options.set(this, void 0);
        __classPrivateFieldSet(this, _Type, type);
        __classPrivateFieldSet(this, _options, options);
        this.base = base;
    }
    getRaw(key) {
        if (typeof key === "string") {
            key = utils_1.Data.from(key).toBuffer();
        }
        if (key.length === 0) {
            key = utils_1.BUFFER_ZERO;
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
        return new (__classPrivateFieldGet(this, _Type))(raw, __classPrivateFieldGet(this, _options));
    }
    set(key, value) {
        return this.base.put(key, value);
    }
    del(key) {
        return this.base.del(key);
    }
}
exports.default = Manager;
_Type = new WeakMap(), _options = new WeakMap();
//# sourceMappingURL=manager.js.map