"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSendSpec = void 0;
const serializable_object_1 = require("./serializable-object");
class MessageSendSpec extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.maxFee = super.initializeValue(this.config.maxFee, options);
    }
    get config() {
        return {
            maxFee: {
                deserializedName: "maxFee",
                serializedName: "MaxFee",
                defaultValue: literal => (literal ? BigInt(literal) : 0n)
            }
        };
    }
}
exports.MessageSendSpec = MessageSendSpec;
//# sourceMappingURL=message-send-spec.js.map