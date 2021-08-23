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
var _defaults, _namespaces;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsConfig = void 0;
const utils_1 = require("@ganache/utils");
const checkForConflicts = (name, namespace, suppliedOptions, conflicts) => {
    if (!conflicts)
        return;
    for (const conflict of conflicts) {
        if (suppliedOptions.has(conflict)) {
            throw new Error(`Values for both "${namespace}.${name}" and ` +
                `"${namespace}.${conflict}" cannot ` +
                `be specified; they are mutually exclusive.`);
        }
    }
};
function fill(defaults, options, target, namespace) {
    const def = defaults[namespace];
    const config = (target[namespace] = target[namespace] || {});
    const flavor = options.flavor;
    const suppliedOptions = new Set();
    const keys = Object.keys(def);
    if (utils_1.hasOwn(options, namespace)) {
        const namespaceOptions = options[namespace];
        for (let i = 0, l = keys.length; i < l; i++) {
            const key = keys[i];
            const propDefinition = def[key];
            let value = namespaceOptions[key];
            if (value !== undefined) {
                checkForConflicts(key, namespace, suppliedOptions, propDefinition.conflicts);
                const normalized = propDefinition.normalize(namespaceOptions[key]);
                config[key] = normalized;
                suppliedOptions.add(key);
            }
            else {
                const legacyName = propDefinition.legacyName || key;
                value = options[legacyName];
                if (value !== undefined) {
                    checkForConflicts(key, namespace, suppliedOptions, propDefinition.conflicts);
                    const normalized = propDefinition.normalize(value);
                    config[key] = normalized;
                    suppliedOptions.add(key);
                }
                else if (utils_1.hasOwn(propDefinition, "default")) {
                    config[key] = propDefinition.default(config, flavor);
                }
            }
        }
    }
    else {
        for (let i = 0, l = keys.length; i < l; i++) {
            const key = keys[i];
            const propDefinition = def[key];
            const legacyName = propDefinition.legacyName || key;
            const value = options[legacyName];
            if (value !== undefined) {
                checkForConflicts(key, namespace, suppliedOptions, propDefinition.conflicts);
                const normalized = propDefinition.normalize(value);
                config[key] = normalized;
                suppliedOptions.add(key);
            }
            else if (utils_1.hasOwn(propDefinition, "default")) {
                config[key] = propDefinition.default(config, flavor);
            }
        }
    }
}
class OptionsConfig {
    constructor(defaults) {
        _defaults.set(this, void 0);
        _namespaces.set(this, void 0);
        __classPrivateFieldSet(this, _defaults, defaults);
        __classPrivateFieldSet(this, _namespaces, Object.keys(defaults));
    }
    normalize(options) {
        const defaults = __classPrivateFieldGet(this, _defaults);
        const out = {};
        __classPrivateFieldGet(this, _namespaces).forEach(namespace => {
            fill(defaults, options, out, namespace);
        });
        return out;
    }
}
exports.OptionsConfig = OptionsConfig;
_defaults = new WeakMap(), _namespaces = new WeakMap();
//# sourceMappingURL=create.js.map