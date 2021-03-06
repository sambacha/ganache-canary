"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseJsonRpcType = exports.toBuffers = exports.toStrings = exports.bufCache = exports.strCache = void 0;
const utils_1 = require("../../utils");
const utils_2 = require("../../utils");
const constants_1 = require("../../utils/constants");
exports.strCache = new WeakMap();
exports.bufCache = new WeakMap();
exports.toStrings = new WeakMap();
exports.toBuffers = new WeakMap();
const inspect = Symbol.for("nodejs.util.inspect.custom");
class BaseJsonRpcType {
    constructor(value) {
        const self = this;
        if (Buffer.isBuffer(value)) {
            exports.toStrings.set(this, () => value.toString("hex"));
            exports.bufCache.set(this, value);
            self[Symbol.toStringTag] = "Buffer";
        }
        else {
            const type = typeof value;
            switch (type) {
                case "number":
                    if (value % 1 !== 0) {
                        throw new Error("`Cannot wrap a decimal value as a json-rpc type`");
                    }
                    exports.toStrings.set(this, () => value.toString(16));
                    exports.toBuffers.set(this, () => value === 0 ? constants_1.BUFFER_EMPTY : utils_2.uintToBuffer(value));
                    break;
                case "bigint":
                    exports.toStrings.set(this, () => value.toString(16));
                    exports.toBuffers.set(this, () => value === 0n ? constants_1.BUFFER_EMPTY : utils_1.bigIntToBuffer(value));
                    break;
                case "string": {
                    // handle hex-encoded string
                    if (value.indexOf("0x") === 0) {
                        exports.strCache.set(this, value.toLowerCase());
                        exports.toBuffers.set(this, () => {
                            let fixedValue = value.slice(2);
                            if (fixedValue.length % 2 === 1) {
                                fixedValue = "0" + fixedValue;
                            }
                            return Buffer.from(fixedValue, "hex");
                        });
                    }
                    else {
                        throw new Error(`cannot convert string value "${value}" into type \`${this.constructor.name}\`; strings must be hex-encoded and prefixed with "0x".`);
                    }
                    break;
                }
                default:
                    // handle undefined/null
                    if (value == null) {
                        // This is a weird thing that returns undefined/null for a call
                        // to toString().
                        this.toString = () => value;
                        exports.bufCache.set(this, constants_1.BUFFER_EMPTY);
                        break;
                    }
                    throw new Error(`Cannot wrap a "${type}" as a json-rpc type`);
            }
            self[Symbol.toStringTag] = type;
        }
        this.value = value;
    }
    // used to make console.log debugging a little easier
    [inspect](_depth, _options) {
        return this.value;
    }
    toString() {
        let str = exports.strCache.get(this);
        if (str === void 0) {
            str = "0x" + exports.toStrings.get(this)();
            exports.strCache.set(this, str);
        }
        return str;
    }
    toBuffer() {
        let buf = exports.bufCache.get(this);
        if (buf === void 0) {
            buf = exports.toBuffers.get(this)();
            exports.bufCache.set(this, buf);
        }
        return buf;
    }
    valueOf() {
        return this.value;
    }
    toJSON() {
        return this.toString();
    }
    isNull() {
        return this.value == null;
    }
}
exports.BaseJsonRpcType = BaseJsonRpcType;
//# sourceMappingURL=json-rpc-base-types.js.map