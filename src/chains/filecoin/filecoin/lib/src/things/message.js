"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const serializable_object_1 = require("./serializable-object");
class Message extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.version = super.initializeValue(this.config.version, options);
        this.to = super.initializeValue(this.config.to, options);
        this.from = super.initializeValue(this.config.from, options);
        this.nonce = super.initializeValue(this.config.nonce, options);
        this.value = super.initializeValue(this.config.value, options);
        this.gasLimit = super.initializeValue(this.config.gasLimit, options);
        this.gasFeeCap = super.initializeValue(this.config.gasFeeCap, options);
        this.gasPremium = super.initializeValue(this.config.gasPremium, options);
        this.method = super.initializeValue(this.config.method, options);
        this.params = super.initializeValue(this.config.params, options);
    }
    get config() {
        return {
            version: {
                deserializedName: "version",
                serializedName: "Version",
                defaultValue: 0
            },
            to: {
                deserializedName: "to",
                serializedName: "To",
                defaultValue: ""
            },
            from: {
                deserializedName: "from",
                serializedName: "From",
                defaultValue: ""
            },
            nonce: {
                deserializedName: "nonce",
                serializedName: "Nonce",
                defaultValue: 0
            },
            value: {
                deserializedName: "value",
                serializedName: "Value",
                defaultValue: literal => (literal ? BigInt(literal) : 0n)
            },
            gasLimit: {
                deserializedName: "gasLimit",
                serializedName: "GasLimit",
                defaultValue: 0 // this gets updated in Blockchain if 0
            },
            gasFeeCap: {
                deserializedName: "gasFeeCap",
                serializedName: "GasFeeCap",
                defaultValue: literal => (literal ? BigInt(literal) : 0n)
            },
            gasPremium: {
                deserializedName: "gasPremium",
                serializedName: "GasPremium",
                defaultValue: literal => (literal ? BigInt(literal) : 0n)
            },
            method: {
                deserializedName: "method",
                serializedName: "Method",
                defaultValue: 0
            },
            params: {
                deserializedName: "params",
                serializedName: "Params",
                defaultValue: literal => typeof literal !== "undefined"
                    ? Buffer.from(literal)
                    : Buffer.from([0])
            }
        };
    }
}
exports.Message = Message;
//# sourceMappingURL=message.js.map