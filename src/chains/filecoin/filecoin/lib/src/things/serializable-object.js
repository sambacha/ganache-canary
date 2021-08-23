"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializableObject = void 0;
const serializable_literal_1 = require("./serializable-literal");
const deep_equal_1 = __importDefault(require("deep-equal"));
const cid_1 = require("./cid");
const borc_1 = __importDefault(require("borc"));
const ipfs_1 = require("ipfs");
const multihashing_1 = __importDefault(require("multihashing"));
const multicodec_1 = __importDefault(require("multicodec"));
// lives in value land
const serializedPropertyName = (definitions, name) => definitions[name].serializedName;
class SerializableObject {
    // The constructor can take in a serialized object, or a deserialized one.
    // Note that SerializableObject is the deserialized object in value land.
    initializeValue(valueConfig, options) {
        if (!options) {
            options = {};
        }
        const def = valueConfig.defaultValue;
        // We don't know whether we were passed a serialized object or a
        // deserialized one, so let's look for both keys.
        const deserializedInput = options[valueConfig.deserializedName];
        const serializedInput = options[valueConfig.serializedName];
        if (typeof deserializedInput !== "undefined") {
            return deserializedInput;
        }
        else if (typeof def === "function") {
            const typedDef = def;
            return typedDef(serializedInput);
        }
        else if (typeof serializedInput !== "undefined") {
            return serializedInput;
        }
        else if (typeof def !== "function") {
            return def;
        }
        else {
            throw new Error(`A value is required for ${this.constructor.name}.${valueConfig.deserializedName}`);
        }
    }
    serializeValue(value) {
        let returnVal = value;
        if (typeof value === "bigint") {
            returnVal = value.toString(10);
        }
        else if (Buffer.isBuffer(value)) {
            // golang serializes "byte[]" with base-64 encoding
            // https://golang.org/src/encoding/json/encode.go?s=6458:6501#L55
            returnVal = value.toString("base64");
        }
        else if (value instanceof SerializableObject ||
            value instanceof serializable_literal_1.SerializableLiteral) {
            returnVal = value.serialize();
        }
        else if (value instanceof Array) {
            returnVal = value.map(item => this.serializeValue(item));
        }
        return returnVal;
    }
    serialize() {
        const returnVal = {};
        for (const [deserializedName, { serializedName }] of Object.entries(this.config)) {
            const value = this[deserializedName];
            returnVal[serializedName] = this.serializeValue(value);
        }
        return returnVal;
    }
    equals(obj) {
        const a = this.serialize();
        const b = obj.serialize();
        return deep_equal_1.default(a, b);
    }
    get cid() {
        // We could have used the ipld-dag-cbor package for the following,
        // but it was async, which caused a number of issues during object construction.
        const cborBuffer = borc_1.default.encode(this.serialize());
        const multihash = multihashing_1.default(cborBuffer, "blake2b-256");
        const rawCid = new ipfs_1.CID(1, multicodec_1.default.print[multicodec_1.default.DAG_CBOR], multihash);
        return new cid_1.CID(rawCid.toString());
    }
}
exports.SerializableObject = SerializableObject;
//# sourceMappingURL=serializable-object.js.map