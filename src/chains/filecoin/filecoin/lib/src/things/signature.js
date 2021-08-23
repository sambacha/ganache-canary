"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signature = void 0;
const serializable_object_1 = require("./serializable-object");
const sig_type_1 = require("./sig-type");
class Signature extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.type = super.initializeValue(this.config.type, options);
        this.data = super.initializeValue(this.config.data, options);
    }
    get config() {
        return {
            type: {
                deserializedName: "type",
                serializedName: "Type",
                defaultValue: sig_type_1.SigType.SigTypeUnknown
            },
            data: {
                deserializedName: "data",
                serializedName: "Data",
                defaultValue: literal => typeof literal !== "undefined"
                    ? Buffer.from(literal, "base64")
                    : Buffer.from([0])
            }
        };
    }
}
exports.Signature = Signature;
//# sourceMappingURL=signature.js.map