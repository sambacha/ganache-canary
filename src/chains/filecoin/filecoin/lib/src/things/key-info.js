"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyInfo = void 0;
const key_type_1 = require("./key-type");
const serializable_object_1 = require("./serializable-object");
class KeyInfo extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.type = super.initializeValue(this.config.type, options);
        this.privateKey = super.initializeValue(this.config.privateKey, options);
    }
    get config() {
        return {
            type: {
                deserializedName: "type",
                serializedName: "Type",
                defaultValue: key_type_1.KeyType.KeyTypeBLS
            },
            privateKey: {
                deserializedName: "privateKey",
                serializedName: "PrivateKey",
                defaultValue: literal => typeof literal !== "undefined"
                    ? Buffer.from(literal, "base64")
                    : Buffer.from([0])
            }
        };
    }
}
exports.KeyInfo = KeyInfo;
//# sourceMappingURL=key-info.js.map