"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializableLiteral = void 0;
class SerializableLiteral {
    constructor(literal) {
        this.value = this.initialize(literal);
    }
    initialize(literal) {
        const def = this.config.defaultValue;
        if (typeof def === "function") {
            return def(literal);
        }
        else if (typeof literal !== "undefined") {
            return literal;
        }
        else if (typeof def !== "function" && typeof def !== "undefined") {
            return def;
        }
        else {
            throw new Error(`A value is required for class ${this.constructor.name}`);
        }
    }
    serialize() {
        if (typeof this.value === "bigint") {
            return this.value.toString(10);
        }
        else if (Buffer.isBuffer(this.value)) {
            return this.value.toString("base64");
        }
        else {
            return this.value;
        }
    }
    equals(obj) {
        const a = this.serialize();
        const b = obj.serialize();
        return a === b;
    }
}
exports.SerializableLiteral = SerializableLiteral;
//# sourceMappingURL=serializable-literal.js.map