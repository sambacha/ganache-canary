"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignedMessage = void 0;
const serializable_object_1 = require("./serializable-object");
const message_1 = require("./message");
const signature_1 = require("./signature");
const sig_type_1 = require("./sig-type");
class SignedMessage extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.message = super.initializeValue(this.config.message, options);
        this.signature = super.initializeValue(this.config.signature, options);
    }
    get config() {
        return {
            message: {
                deserializedName: "message",
                serializedName: "Message",
                defaultValue: options => new message_1.Message(options)
            },
            signature: {
                deserializedName: "signature",
                serializedName: "Signature",
                defaultValue: options => new signature_1.Signature(options)
            }
        };
    }
    // Reference implementation: https://git.io/Jt53i
    get cid() {
        if (this.signature.type === sig_type_1.SigType.SigTypeBLS) {
            return this.message.cid;
        }
        else {
            return super.cid;
        }
    }
}
exports.SignedMessage = SignedMessage;
//# sourceMappingURL=signed-message.js.map